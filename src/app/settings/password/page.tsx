'use client'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock } from 'lucide-react'

export default function PasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  async function handleSave() {
    setError('')
    if (password.length < 6) {
      setError('密码长度至少 6 位')
      return
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }
    setSaving(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) {
      console.error('修改密码失败:', updateError)
      setError('修改失败:' + updateError.message)
      return
    }

    setToast('密码已修改')
    setPassword('')
    setConfirm('')
    setTimeout(() => {
      setToast('')
      router.push('/mine')
    }, 1500)
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
        <h1 className="font-semibold text-gray-900">修改密码</h1>
        <div className="w-5" />
      </div>

      <div className="px-4 space-y-4">
        <div>
          <h2 className="font-medium text-gray-900 mb-2">新密码</h2>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-white"
            placeholder="至少 6 位"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <h2 className="font-medium text-gray-900 mb-2">确认新密码</h2>
          <input
            type="password"
            className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-white"
            placeholder="再次输入新密码"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-2xl font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600"
        >
          {saving ? '保存中...' : '确认修改'}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Lock size={12} />
          <span>修改后请使用新密码登录</span>
        </div>
      </div>
    </div>
  )
}
