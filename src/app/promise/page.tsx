'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, ImagePlus, X } from 'lucide-react'
import { uploadEvidencePhotos, uploadAudio } from '@/lib/upload-evidence'
import { CHANNELS, ROLES, STATUSES, roleToPersonType, personTypeToRole } from '@/lib/promise-meta'
import AudioRecorder, { AudioChange } from '@/components/audio-recorder'

const TAGS = ['押金', '退租', '维修', '租金', '费用', '合同', '其他']
const MAX_PHOTOS = 9
const MAX_PHOTO_SIZE = 10 * 1024 * 1024

// Date -> <input type="datetime-local"> 需要的本地字符串（YYYY-MM-DDTHH:mm）
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function PromisePage() {
  const router = useRouter()
  const [inputType, setInputType] = useState<'text' | 'voice'>('text')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  // 新增的核心字段
  const [role, setRole] = useState<string>('房东')
  const [channel, setChannel] = useState<string>('微信')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<string>('未履行')
  const [promisedAt, setPromisedAt] = useState('')

  // 语音附件
  const [audioState, setAudioState] = useState<AudioChange | null>(null)
  const [existingAudioPath, setExistingAudioPath] = useState<string | null>(null)
  const [existingAudioUrl, setExistingAudioUrl] = useState<string | null>(null)
  const [audioKey, setAudioKey] = useState(0) // 保存成功后重置录音组件用

  // 编辑模式
  const [editId, setEditId] = useState<string | null>(null)
  const isEdit = editId !== null

  // 进入页面：默认承诺时间=当前；若带 ?id= 则进入编辑模式并预填
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')
    if (!id) {
      setPromisedAt(toLocalInput(new Date()))
      return
    }
    loadForEdit(id)
  }, [])

  async function loadForEdit(id: string) {
    const { data, error: loadError } = await supabase
      .from('promise_records').select('*').eq('id', id).single()
    if (loadError || !data) {
      console.error('读取承诺记录失败:', loadError)
      setError('读取这条记录失败，可能已被删除')
      setPromisedAt(toLocalInput(new Date()))
      return
    }
    setEditId(id)
    setContent(data.content || '')
    setInputType(data.input_type === 'voice' ? 'voice' : 'text')
    setSelectedTags(data.tags ? data.tags.split(',').filter(Boolean) : [])
    setNote(data.note || '')
    setRole(data.counterparty_role || personTypeToRole(data.person_type))
    setChannel(data.channel || '微信')
    setContact(data.counterparty_contact || '')
    setStatus(data.status || '未履行')
    setPromisedAt(data.promised_at ? toLocalInput(new Date(data.promised_at)) : toLocalInput(new Date()))

    // 已存的音频：记下路径并签出临时链接供试听
    if (data.audio_url) {
      setExistingAudioPath(data.audio_url)
      const { data: signed } = await supabase.storage
        .from('evidence').createSignedUrl(data.audio_url, 3600)
      setExistingAudioUrl(signed?.signedUrl ?? null)
    }
  }

  // 为选中的图片生成预览 URL，photos 变化或卸载时释放旧 URL，避免内存泄漏
  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [photos])

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // 清空，方便再次选择同一文件
    if (files.length === 0) return
    setError('')

    if (files.some((f) => !f.type.startsWith('image/'))) {
      setError('只能上传图片格式')
      return
    }
    if (files.some((f) => f.size > MAX_PHOTO_SIZE)) {
      setError('每张图片不能超过 10MB')
      return
    }
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`最多上传 ${MAX_PHOTOS} 张图片`)
      return
    }
    setPhotos((prev) => [...prev, ...files])
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    // 语音模式可只录音不填文字；文字模式需有内容。两者都没有时拦下。
    const keepingAudio = audioState?.kind === 'new' || (!audioState && !!existingAudioPath)
    if (!content.trim() && !keepingAudio) {
      setToast('请输入承诺内容或录制语音')
      setTimeout(() => setToast(''), 2000)
      return
    }
    setError('')
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      setError('请先登录再保存')
      return
    }

    // 处理语音附件：新增/替换则上传新音频并删旧；删除则清空；不变则保留
    let audioPath: string | null = existingAudioPath
    try {
      if (audioState?.kind === 'new') {
        audioPath = await uploadAudio(audioState.blob, user.id, audioState.ext)
        if (existingAudioPath) await supabase.storage.from('evidence').remove([existingAudioPath])
      } else if (audioState?.kind === 'removed') {
        if (existingAudioPath) await supabase.storage.from('evidence').remove([existingAudioPath])
        audioPath = null
      }
    } catch (err) {
      setSaving(false)
      console.error(err)
      setError(err instanceof Error ? err.message : '音频上传失败')
      return
    }

    // 核心字段（编辑/新增共用）
    const core = {
      person_type: roleToPersonType(role),
      counterparty_role: role,
      channel: channel,
      counterparty_contact: contact,
      status: status,
      promised_at: promisedAt ? new Date(promisedAt).toISOString() : null,
      content: content,
      input_type: inputType,
      tags: selectedTags.join(','),
      note: note,
      audio_url: audioPath,
    }

    if (isEdit) {
      // 编辑：不动 photos 列（附件编辑后面再做）
      const { error: saveError } = await supabase
        .from('promise_records').update(core).eq('id', editId)
      setSaving(false)
      if (saveError) {
        console.error('保存失败:', saveError)
        setError('保存失败:' + saveError.message)
        return
      }
      router.push(`/records/promise-${editId}`)
      return
    }

    // 新增：先压缩上传证据图片
    let photoPaths: string[] = []
    try {
      photoPaths = await uploadEvidencePhotos(photos, user.id)
    } catch (err) {
      setSaving(false)
      console.error(err)
      setError(err instanceof Error ? err.message : '图片上传失败')
      return
    }

    const { error: saveError } = await supabase.from('promise_records').insert({
      ...core,
      is_favorite: false,
      user_id: user.id,
      photos: photoPaths,
    })
    setSaving(false)
    if (saveError) {
      console.error('保存失败:', saveError)
      setError('保存失败:' + saveError.message)
      return
    }
    setToast('记录已保存')
    setContent('')
    setSelectedTags([])
    setNote('')
    setContact('')
    setPhotos([])
    setAudioState(null)
    setExistingAudioPath(null)
    setExistingAudioUrl(null)
    setAudioKey((k) => k + 1) // 重置录音组件
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <div className="pb-20">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full z-50">
          {toast}
        </div>
      )}

      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/records">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">{isEdit ? '编辑承诺' : '记录承诺'}</h1>
        <button onClick={handleSave} className="text-sm text-indigo-600 font-medium">
          {isEdit ? '保存' : '保存记录'}
        </button>
      </div>

      <div className="px-4 space-y-5">
        {/* 对方身份 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">对方身份</h2>
          <div className="grid grid-cols-4 gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                  role === r
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* 对方联系方式 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">对方联系方式（选填）</h2>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-white"
            placeholder="微信号 / 手机号等"
            value={contact}
            onChange={(e) => setContact(e.target.value.slice(0, 100))}
          />
        </div>

        {/* 承诺方式 + 承诺时间 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h2 className="font-medium text-gray-900 mb-3">承诺方式</h2>
            <select
              className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-white"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <h2 className="font-medium text-gray-900 mb-3">承诺状态</h2>
            <select
              className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 承诺时间 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">承诺时间</h2>
          <input
            type="datetime-local"
            className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-white"
            value={promisedAt}
            onChange={(e) => setPromisedAt(e.target.value)}
          />
        </div>

        {/* 承诺内容 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">承诺内容</h2>
          <div className="flex gap-2 mb-3">
            {(['text', 'voice'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setInputType(type)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                  inputType === type
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : 'border-gray-200 text-gray-400'
                }`}
              >
                {type === 'text' ? '文字输入' : '语音输入'}
              </button>
            ))}
          </div>
          {inputType === 'text' ? (
            <div className="relative">
              <textarea
                className="w-full border border-gray-200 rounded-2xl p-3 text-sm resize-none bg-white h-32"
                placeholder={`请输入对方的承诺内容，例如：\n房东说押金会在退租后7天内全部退还，\n如果房子没损坏的话。`}
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 500))}
              />
              <span className="absolute bottom-2 right-3 text-xs text-gray-400">{content.length}/500</span>
            </div>
          ) : (
            <AudioRecorder key={audioKey} existingUrl={existingAudioUrl} onChange={setAudioState} />
          )}
        </div>

        {/* 标签 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">相关标签（可多选）</h2>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 备注 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">添加备注（选填）</h2>
          <div className="relative">
            <textarea
              className="w-full border border-gray-200 rounded-2xl p-3 text-sm resize-none bg-white h-20"
              placeholder="补充说明..."
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
            />
            <span className="absolute bottom-2 right-3 text-xs text-gray-400">{note.length}/200</span>
          </div>
        </div>

        {/* 证据照片（仅新增模式；附件编辑后面再做） */}
        {!isEdit && (
          <div>
            <h2 className="font-medium text-gray-900 mb-3">证据照片（选填，最多 {MAX_PHOTOS} 张）</h2>
            <div className="grid grid-cols-3 gap-2">
              {previews.map((url, i) => (
                <div key={url} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`证据照片 ${i + 1}`} className="w-full h-full object-cover rounded-xl border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white rounded-full p-0.5 shadow"
                    aria-label="删除这张照片"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 cursor-pointer bg-gray-50">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
                  <ImagePlus size={20} />
                  <span className="text-xs mt-1">{photos.length}/{MAX_PHOTOS}</span>
                </label>
              )}
            </div>
          </div>
        )}
        {isEdit && (
          <p className="text-xs text-gray-400">证据照片的编辑即将支持，本次修改不会改动已有照片。</p>
        )}

        {/* 错误提示 */}
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-2xl font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600"
        >
          {saving ? '保存中...' : isEdit ? '保存修改' : '保存记录'}
        </button>

        {toast === '记录已保存' && (
          <Link href="/records" className="block text-center text-sm text-indigo-600 font-medium">
            去看看记录 →
          </Link>
        )}

        {/* 安全提示 */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pb-4">
          <Lock size={12} />
          <span>所有记录仅你可见，安全存储</span>
        </div>
      </div>
    </div>
  )
}
