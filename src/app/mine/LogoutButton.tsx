'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="shrink-0 bg-white/20 rounded-full px-3 py-2 text-sm font-medium flex items-center gap-1 disabled:opacity-60"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
      退出
    </button>
  )
}