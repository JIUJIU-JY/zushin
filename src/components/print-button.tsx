'use client'

import { Printer } from 'lucide-react'

export default function PrintButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className={
        className ??
        'flex items-center gap-1 text-sm text-indigo-600 font-medium border border-indigo-200 rounded-full px-3 py-1.5'
      }
    >
      <Printer size={14} /> 导出 PDF
    </button>
  )
}
