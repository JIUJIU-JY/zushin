'use client'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'

const TAGS = ['押金', '退租', '维修', '租金', '费用', '合同', '其他']

export default function PromisePage() {
  const [personType, setPersonType] = useState<'landlord' | 'agent' | 'other'>('landlord')
  const [inputType, setInputType] = useState<'text' | 'voice'>('text')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

 async function handleSave() {
  if (!content.trim()) {
    setToast('请输入承诺内容')
    setTimeout(() => setToast(''), 2000)
    return
  }
  setSaving(true)
  const { error } = await supabase.from('promise_records').insert({
    person_type: personType,
    content: content,
    input_type: inputType,
    tags: selectedTags.join(','),
    note: note,
    is_favorite: false,
  })
  setSaving(false)
  if (error) {
    setToast('保存失败，请稍后重试')
  } else {
    setToast('记录已保存')
    setContent('')
    setSelectedTags([])
    setNote('')
  }
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