import Link from 'next/link'
import { User, Settings, Shield, FileText, HelpCircle, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getStats() {
  const [contracts, promises, favContracts, favPromises] = await Promise.all([
    supabase.from('contract_checks').select('*', { count: 'exact', head: true }),
    supabase.from('promise_records').select('*', { count: 'exact', head: true }),
    supabase.from('contract_checks').select('*', { count: 'exact', head: true }).eq('is_favorite', true),
    supabase.from('promise_records').select('*', { count: 'exact', head: true }).eq('is_favorite', true),
  ])
  return {
    contractCount: contracts.count ?? 0,
    promiseCount: promises.count ?? 0,
    favoriteCount: (favContracts.count ?? 0) + (favPromises.count ?? 0),
  }
}

export default async function MinePage() {
  const { contractCount, promiseCount, favoriteCount } = await getStats()

  const stats = [
    { label: '合同体检', value: contractCount, href: '/records?tab=contract_check' },
    { label: '承诺记录', value: promiseCount, href: '/records?tab=promise_record' },
    { label: '收藏记录', value: favoriteCount, href: '/records?fav=1' },
  ]

  const menuItems = [
    { icon: FileText, label: '我的合同', desc: '查看所有合同体检记录', href: '/records', soon: false },
    { icon: Shield, label: '隐私设置', desc: '管理你的数据和隐私', soon: true },
    { icon: Settings, label: '通用设置', desc: '语言、通知等设置', soon: true },
    { icon: HelpCircle, label: '帮助与反馈', desc: '常见问题和意见反馈', soon: true },
  ]

  return (
    <div className="pb-20 px-4">
      <div className="flex items-center justify-between py-4">
        <h1 className="font-semibold text-gray-900">我的</h1>
        <Settings size={20} className="text-gray-400" />
      </div>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 mb-6 text-white flex items-center gap-4">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
          <User size={28} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-lg">租房用户</p>
          <p className="text-indigo-100 text-sm">租房路上，不再一个人</p>
        </div>
      </div>

      {/* 统计：点击跳到对应筛选的记录 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl p-3 text-center shadow-sm active:scale-[0.97] transition-transform"
          >
            <p className="text-xl font-bold text-indigo-600">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* 菜单 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {menuItems.map(({ icon: Icon, label, desc, href, soon }, index) => {
          const row = (
            <div
              className={`flex items-center justify-between p-4 ${
                index !== menuItems.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Icon size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
              {soon ? (
                <span className="text-xs text-gray-300">敬请期待</span>
              ) : (
                <ChevronRight size={16} className="text-gray-300" />
              )}
            </div>
          )
          return href ? (
            <Link key={label} href={href} className="block">{row}</Link>
          ) : (
            <div key={label}>{row}</div>
          )
        })}
      </div>

      <p className="text-center text-xs text-gray-300 mt-8">租信 v0.1 · 租房路上，不再一个人</p>
    </div>
  )
}