import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomTabBar from '@/components/bottom-tab-bar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '租信 - 租房路上，不再一个人',
  description: '让租房更透明，让承诺有记录',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <div className="min-h-screen bg-[#F8FAFF] flex justify-center">
          <div className="w-full max-w-[390px] relative min-h-screen">
            {children}
            <BottomTabBar />
          </div>
        </div>
      </body>
    </html>
  )
}