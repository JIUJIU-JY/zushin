'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function translateError(msg: string) {
    if (msg.includes('Invalid login credentials')) return '邮箱或密码不对'
    if (msg.includes('already registered')) return '这个邮箱已经注册过了,直接登录吧'
    if (msg.includes('Password should be at least')) return '密码太短,至少 6 位'
    if (msg.includes('Unable to validate email')) return '邮箱格式不对'
    if (msg.includes('rate limit')) return '操作太频繁,稍等一下再试'
    return msg
  }

  async function handleSubmit() {
    setError('')
    if (!email || !password) return setError('请填写邮箱和密码')
    if (password.length < 6) return setError('密码至少 6 位')

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      // 整页跳转:带着新登录状态加载,并清掉路由缓存里残留的"未登录跳转"
      window.location.href = '/mine'
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : '出错了,请重试'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 pb-20">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">租</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">租信</h1>
        <p className="text-sm text-gray-400 mt-1">租房路上,不再一个人</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
          <Mail size={18} className="text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            autoComplete="email"
            className="flex-1 outline-none text-sm text-gray-900 bg-transparent"
          />
        </div>
        <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
          <Lock size={18} className="text-gray-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码(至少 6 位)"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 outline-none text-sm text-gray-900 bg-transparent"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mt-3 text-center">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl py-3 mt-5 font-medium flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {mode === 'login' ? '登录' : '注册并登录'}
      </button>

      <p className="text-center text-xs text-gray-400 mt-3 leading-relaxed">
        注册即表示同意
        <Link href="/terms" className="text-indigo-600">《用户协议》</Link>
        和
        <Link href="/privacy" className="text-indigo-600">《隐私政策》</Link>
      </p>

      <p className="text-center text-sm text-gray-400 mt-5">
        {mode === 'login' ? '还没有账号?' : '已经有账号了?'}
        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
          className="text-indigo-600 font-medium ml-1"
        >
          {mode === 'login' ? '去注册' : '去登录'}
        </button>
      </p>

      <Link href="/" className="text-center text-xs text-gray-300 mt-8">先随便逛逛 →</Link>
    </div>
  )
}