'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()
  return (
    <button onClick={() => router.back()} aria-label="返回">
      <ArrowLeft size={20} className="text-gray-600" />
    </button>
  )
}
