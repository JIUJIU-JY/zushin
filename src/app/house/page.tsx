'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ImagePlus, X, Trash2, Lock, FileText, Mic, User } from 'lucide-react'
import { RiskLevel } from '@/lib/types'
import PhotoGallery from '@/components/photo-gallery'

const MAX_PHOTOS = 9
const MAX_PHOTO_SIZE = 10 * 1024 * 1024

type HouseRecord = {
  id: string
  note: string
  created_at: string
  photoUrls: string[]
}

type ContractSummary = {
  id: string
  fileName: string
  riskLevel: RiskLevel
  createdAt: string
}

type PromiseSummary = {
  id: string
  personType: string
  content: string
  createdAt: string
}

// 与 records 页保持一致的风险标签与对方标签
const riskLabel = (level: RiskLevel) => {
  if (level === 'high') return { text: '高风险', color: 'bg-red-100 text-red-600' }
  if (level === 'medium') return { text: '中风险', color: 'bg-orange-100 text-orange-600' }
  return { text: '低风险', color: 'bg-green-100 text-green-600' }
}

const personLabel = (personType: string) =>
  personType === 'landlord' ? '房东承诺' : personType === 'agent' ? '中介沟通' : '其他记录'

export default function HousePage() {
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [records, setRecords] = useState<HouseRecord[]>([])
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  const [promises, setPromises] = useState<PromiseSummary[]>([])
  const [loading, setLoading] = useState(true)

  // 为选中的图片生成预览 URL，photos 变化或卸载时释放旧 URL，避免内存泄漏
  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [photos])

  useEffect(() => {
    loadRecords()
  }, [])

  async function loadRecords() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setRecords([])
      setContracts([])
      setPromises([])
      setLoading(false)
      return
    }

    const [houseRes, contractsRes, promisesRes] = await Promise.all([
      supabase.from('house_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('contract_checks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('promise_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    if (houseRes.error) console.error('读取房屋档案失败:', houseRes.error)
    if (contractsRes.error) console.error('读取合同体检失败:', contractsRes.error)
    if (promisesRes.error) console.error('读取承诺记录失败:', promisesRes.error)

    // 私有桶里的照片需要临时签名链接才能显示
    const withUrls: HouseRecord[] = await Promise.all(
      (houseRes.data || []).map(async (row) => {
        const paths: string[] = Array.isArray(row.photos) ? row.photos : []
        const signed = await Promise.all(
          paths.map((p) => supabase.storage.from('evidence').createSignedUrl(p, 3600))
        )
        const photoUrls = signed
          .map((s) => s.data?.signedUrl)
          .filter((u): u is string => Boolean(u))
        return { id: row.id, note: row.note || '', created_at: row.created_at, photoUrls }
      })
    )

    setRecords(withUrls)
    setContracts(
      (contractsRes.data || []).map((row) => ({
        id: row.id,
        fileName: row.file_name,
        riskLevel: row.risk_level as RiskLevel,
        createdAt: row.created_at,
      }))
    )
    setPromises(
      (promisesRes.data || []).map((row) => ({
        id: row.id,
        personType: row.person_type,
        content: row.content,
        createdAt: row.created_at,
      }))
    )
    setLoading(false)
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
    setError('')
    if (photos.length === 0 && !note.trim()) {
      setToast('请至少添加一张照片或填写备注')
      setTimeout(() => setToast(''), 2000)
      return
    }
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      setError('请先登录再保存')
      return
    }

    // 逐张上传照片到 evidence 桶，收集成功上传的路径
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

    const { error: saveError } = await supabase.from('house_records').insert({
      note: note,
      photos: photoPaths,
      user_id: user.id,
    })
    setSaving(false)
    if (saveError) {
      console.error('保存失败:', saveError)
      setError('保存失败:' + saveError.message)
      return
    }

    setToast('已保存')
    setPhotos([])
    setNote('')
    setTimeout(() => setToast(''), 2000)
    loadRecords()
  }

  async function handleDelete(id: string) {
    if (!confirm('确定删除这条房屋档案吗？')) return

    const { error: delError } = await supabase.from('house_records').delete().eq('id', id)
    if (delError) {
      console.error('删除失败:', delError)
      setError('删除失败:' + delError.message)
      return
    }
    setRecords((prev) => prev.filter((r) => r.id !== id))
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
        <Link href="/">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">房屋档案</h1>
        <button onClick={handleSave} className="text-sm text-indigo-600 font-medium">
          保存
        </button>
      </div>

      <div className="px-4 space-y-5">
        {/* 房屋照片 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">房屋照片（最多 {MAX_PHOTOS} 张）</h2>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((url, i) => (
              <div key={url} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`房屋照片 ${i + 1}`} className="w-full h-full object-cover rounded-xl border border-gray-200" />
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

        {/* 备注 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">添加备注（选填）</h2>
          <div className="relative">
            <textarea
              className="w-full border border-gray-200 rounded-2xl p-3 text-sm resize-none bg-white h-20"
              placeholder="补充说明，例如：入住前客厅墙面已有裂缝..."
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
            />
            <span className="absolute bottom-2 right-3 text-xs text-gray-400">{note.length}/200</span>
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
          {saving ? '保存中...' : '保存'}
        </button>

        {/* 安全提示 */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Lock size={12} />
          <span>所有记录仅你可见，安全存储</span>
        </div>

        {/* 已保存的房屋档案 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">我的房屋档案</h2>
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">加载中...</p>
          ) : records.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-sm text-gray-400">还没有房屋档案</p>
              <p className="text-xs text-gray-300 mt-1">拍下房屋现状，留作日后凭证</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <p className="text-xs text-gray-400">{new Date(record.created_at).toLocaleString()}</p>
                    <button
                      type="button"
                      onClick={() => handleDelete(record.id)}
                      className="text-gray-400"
                      aria-label="删除这条记录"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {record.note && (
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{record.note}</p>
                  )}
                  {record.photoUrls.length > 0 && <PhotoGallery urls={record.photoUrls} title="房屋照片" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 合同体检（只读汇总） */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">合同体检</h2>
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">加载中...</p>
          ) : contracts.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-sm text-gray-400">暂无</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contracts.map((c) => (
                <Link key={c.id} href={`/records/contract-${c.id}`} className="block">
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.fileName}</p>
                        <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${riskLabel(c.riskLevel).color}`}>
                      {riskLabel(c.riskLevel).text}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 承诺记录（只读汇总） */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">承诺记录</h2>
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">加载中...</p>
          ) : promises.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-sm text-gray-400">暂无</p>
            </div>
          ) : (
            <div className="space-y-2">
              {promises.map((p) => {
                const isAgent = p.personType === 'agent'
                const Icon = isAgent ? User : Mic
                return (
                  <Link key={p.id} href={`/records/promise-${p.id}`} className="block">
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform">
                      <div className="flex items-center gap-3 mb-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAgent ? 'bg-orange-100' : 'bg-green-100'}`}>
                          <Icon size={14} className={isAgent ? 'text-orange-600' : 'text-green-600'} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{personLabel(p.personType)}</p>
                          <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{p.content}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
