'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function PhotoGallery({ urls }: { urls: string[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const isOpen = activeIndex !== null

  // 打开放大图时禁止背景滚动
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  return (
    <div>
      <h3 className="font-medium text-gray-900 mb-3">证据照片（{urls.length}）</h3>
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setActiveIndex(i)}
            className="aspect-square rounded-xl overflow-hidden border border-gray-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`证据照片 ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute top-4 right-4 text-white"
            aria-label="关闭"
          >
            <X size={28} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[activeIndex]}
            alt={`证据照片 ${activeIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
