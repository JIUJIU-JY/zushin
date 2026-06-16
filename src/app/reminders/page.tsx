'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, CalendarClock } from 'lucide-react'
import { daysUntilDate, countdownText } from '@/lib/reminders'

const PRESETS = ['押金退还', '合同到期', '退租通知', '租金缴纳']

type Reminder = {
  id: string
  title: string
  remindDate: string
  note: string
}

export default function RemindersPage() {
  const [title, setTitle] = useState('')
  const [remindDate, setRemindDate] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReminders()
  }, [])

  async function loadReminders() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setReminders([])
      setLoading(false)
      return
    }

    const { data, error: loadError } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('remind_date', { ascending: true })

    if (loadError) {
      console.error('读取提醒失败:', loadError)
      setError('读取提醒失败:' + loadError.message)
      setLoading(false)
      return
    }

    setReminders(
      (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        remindDate: row.remind_date,
        note: row.note || '',
      }))
    )
    setLoading(false)
  }

  async function handleSave() {
    setError('')
    if (!title.trim()) {
      setToast('请输入提醒标题')
      setTimeout(() => setToast(''), 2000)
      return
    }
    if (!remindDate) {
      setToast('请选择日期')
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

    const { error: saveError } = await supabase.from('reminders').insert({
      title: title,
      remind_date: remindDate,
      note: note,
      user_id: user.id,
    })
    setSaving(false)
    if (saveError) {
      console.error('保存失败:', saveError)
      setError('保存失败:' + saveError.message)
      return
    }

    setToast('提醒已添加')
    setTitle('')
    setRemindDate('')
    setNote('')
    setTimeout(() => setToast(''), 2000)
    loadReminders()
  }

  async function handleDelete(id: string) {
    if (!confirm('确定删除这条提醒吗？')) return

    const { error: delError } = await supabase.from('reminders').delete().eq('id', id)
    if (delError) {
      console.error('删除失败:', delError)
      setError('删除失败:' + delError.message)
      return
    }
    setReminders((prev) => prev.filter((r) => r.id !== id))
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
        <h1 className="font-semibold text-gray-900">日期提醒</h1>
        <button onClick={handleSave} className="text-sm text-indigo-600 font-medium">
          添加
        </button>
      </div>

      <div className="px-4 space-y-5">
        {/* 添加提醒 */}
        <div className="space-y-3">
          <div>
            <h2 className="font-medium text-gray-900 mb-2">提醒标题</h2>
            <input
              className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-white"
              placeholder="例如：押金退还"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 50))}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setTitle(preset)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    title === preset
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-medium text-gray-900 mb-2">日期</h2>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-white"
              value={remindDate}
              onChange={(e) => setRemindDate(e.target.value)}
            />
          </div>

          <div>
            <h2 className="font-medium text-gray-900 mb-2">备注（选填）</h2>
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

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-2xl font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            {saving ? '保存中...' : '添加提醒'}
          </button>
        </div>

        {/* 提醒列表 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">我的提醒</h2>
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">加载中...</p>
          ) : reminders.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-sm text-gray-400">还没有提醒</p>
              <p className="text-xs text-gray-300 mt-1">添加押金退还、合同到期等关键日期，到点提醒你</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reminders.map((r) => {
                const days = daysUntilDate(r.remindDate)
                const color =
                  days < 0 ? 'text-red-600' : days <= 7 ? 'text-amber-600' : 'text-gray-400'
                return (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-start justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <CalendarClock size={14} className="text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                        <p className="text-xs text-gray-400">
                          {r.remindDate} · <span className={color}>{countdownText(days)}</span>
                        </p>
                        {r.note && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{r.note}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="text-gray-400 shrink-0 ml-2"
                      aria-label="删除这条提醒"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
