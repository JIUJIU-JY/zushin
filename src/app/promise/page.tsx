'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, ImagePlus, X } from 'lucide-react'

const TAGS = ['押金', '退租', '维修', '租金', '费用', '合同', '其他']
const MAX_PHOTOS = 9
const MAX_PHOTO_SIZE = 10 * 1024 * 1024

export default function PromisePage() {
  const [personType, setPersonType] = useState<'landlord' | 'agent' | 'other'>('landlord')
  const [inputType, setInputType] = useState<'text' | 'voice'>('text')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

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
  if (!content.trim()) {
    setToast('请输入承诺内容')
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

  // 逐张上传证据图片到 evidence 桶，收集成功上传的路径
  const photoPaths: string[] = []
  for (const file of photos) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('evidence').upload(path, file)
    if (uploadError) {
      setSaving(false)
      console.error('图片上传失败:', uploadError)
      setError('图片上传失败:' + uploadError.message)
      return
    }
    photoPaths.push(path)
  }

  const { error: saveError } = await supabase.from('promise_records').insert({
    person_type: personType,
    content: content,
    input_type: inputType,
    tags: selectedTags.join(','),
    note: note,
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
  setPhotos([])
  setTimeout(() => setToast(''), 2000)
}

  const personTypes = [
    { value: 'landlord', label: '房东' },
    { value: 'agent', label: '中介' },
    { value: 'other', label: '其他' },
  ] as const

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
        <Link href="/">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">记录承诺</h1>
        <button onClick={handleSave} className="text-sm text-indigo-600 font-medium">
          保存记录
        </button>
      </div>

      <div className="px-4 space-y-5">
        {/* 对方身份 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">对方是谁？</h2>
          <div className="flex gap-3">
            {personTypes.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPersonType(value)}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                  personType === value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                    : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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
            <div className="border border-gray-200 rounded-2xl p-8 text-center bg-gray-50">
              <p className="text-gray-400 text-sm">语音输入功能即将上线</p>
            </div>
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

        {/* 证据照片 */}
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
          {saving ? '保存中...' : '保存记录'}
        </button>

        {/* 安全提示 */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pb-4">
          <Lock size={12} />
          <span>所有记录仅你可见，安全存储</span>
        </div>
      </div>
    </div>
  )
}