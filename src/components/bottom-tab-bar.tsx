'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileSearch, BookOpen, User } from 'lucide-react'

const tabs = [
  { href: '/', label: '首页', icon: Home },
  { href: '/check', label: '体检', icon: FileSearch },
  { href: '/records', label: '记录', icon: BookOpen },
  { href: '/mine', label: '我的', icon: User },
]

export default function BottomTabBar() {
  const pathname = usePathname()
  if (pathname === '/login') return null

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-100 z-50">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 flex-1 py-2"
            >
              <Icon
                size={22}
                className={active ? 'text-indigo-600' : 'text-gray-400'}
              />
              <span className={`text-xs ${active ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}