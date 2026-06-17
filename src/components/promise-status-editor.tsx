'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { STATUSES } from '@/lib/promise-meta'

export default function PromiseStatusEditor({
  recordId,
  initialStatus,
}: {
  recordId: string
  initialStatus: string
}) {
  const [status, setStatus] = useState(initialStatus)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  async function change(next: string) {
    if (next === status || saving) return
    const prev = status
    setStatus(next) // 乐观更新
    setSaving(true)

    const { error } = await supabase
      .from('promise_records')
      .update({ status: next })
      .eq('id', recordId)

    setSaving(false)
    if (error) {
      console.error('更新承诺状态失败:', error)
      setStatus(prev) // 失败回滚
      setToast('保存失败，请重试')
    } else {
      setToast('已更新')
    }
    setTimeout(() => setToast(''), 1500)
  }

  return (
    <div>
      <div className="flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => change(s)}
            disabled={saving}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
              status === s
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                : 'border-gray-200 bg-white text-gray-500'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {toast && <p className="text-xs text-gray-400 mt-2">{toast}</p>}
    </div>
  )
}
