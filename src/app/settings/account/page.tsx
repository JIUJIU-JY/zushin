'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AccountSettingsPage() {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleExport() {
    setError('')
    setExporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setExporting(false)
        setError('请先登录')
        return
      }

      const [contractsRes, promisesRes] = await Promise.all([
        supabase.from('contract_checks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('promise_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      if (contractsRes.error || promisesRes.error) {
        console.error('导出读取失败:', contractsRes.error, promisesRes.error)
        setExporting(false)
        setError('导出失败，请稍后重试')
        return
      }

      const payload = {
        exportedAt: new Date().toISOString(),
        account: user.email,
        contractChecks: contractsRes.data || [],
        promiseRecords: promisesRes.data || [],
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `租信数据导出-${stamp}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      setToast('已导出')
      setTimeout(() => setToast(''), 2000)
    } catch (err) {
      console.error(err)
      setError('导出失败，请稍后重试')
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    setError('')
    setDeleting(true)
    try {
      const res = await fetch('/api/delete-account', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleting(false)
        setError(data.error || '注销失败，请稍后重试')
        return
      }
      // 双保险：再清一次本地会话，然后整页跳登录
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (err) {
      console.error(err)
      setDeleting(false)
      setError('注销失败，请稍后重试')
    }
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
        <Link href="/mine">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">账号与数据</h1>
        <div className="w-5" />
      </div>

      <div className="px-4 space-y-6">
        {/* 导出数据 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-2">导出我的数据</h2>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            把你的合同体检和承诺记录导出为 JSON 文件保存到本地。
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-3 rounded-2xl font-medium text-sm border border-indigo-200 text-indigo-600 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? '导出中...' : '导出为 JSON'}
          </button>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {/* 危险区域：注销账号 */}
        <div className="border border-red-100 rounded-2xl p-4 bg-red-50/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="font-medium text-gray-900">注销账号</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            注销后将永久删除你的账号，以及全部合同体检、承诺记录、房屋档案、日期提醒和上传的照片。此操作不可恢复。
          </p>
          <button
            onClick={() => { setShowConfirm(true); setConfirmText(''); setError('') }}
            className="w-full py-3 rounded-2xl font-medium text-sm border border-red-200 text-red-600 flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            注销账号
          </button>
        </div>
      </div>

      {/* 二次确认 */}
      {showConfirm && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => !deleting && setShowConfirm(false)} />
          <div className="relative w-full max-w-[390px] bg-white rounded-t-3xl p-5 pb-10">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <p className="font-semibold text-gray-900">确认注销账号？</p>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed px-2">
                你的账号和所有数据将被永久删除，无法恢复。
              </p>
            </div>

            <p className="text-xs text-gray-500 mb-2">请输入 <span className="font-semibold text-red-600">注销</span> 以确认：</p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="注销"
              className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-white mb-4"
            />

            {error && <p className="text-sm text-red-500 text-center mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-medium disabled:opacity-60"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || confirmText !== '注销'}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                {deleting ? '注销中...' : '确认注销'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
