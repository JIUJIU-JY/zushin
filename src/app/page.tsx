import Link from 'next/link'
import { Bell, User, FileText, Mic, Star, ChevronRight, Home, CalendarClock } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'
import { daysUntilDate, countdownText } from '@/lib/reminders'

// 让首页每次都读最新数据，避免生产环境被静态缓存导致"新增了却不更新"
export const dynamic = 'force-dynamic'

type RecentRecord = {
  id: string
  type: 'contract_check' | 'promise_record' | 'agent_communication'
  title: string
  createdAt: string
  createdAtRaw: string
  riskLevel?: 'high' | 'medium' | 'low'
}

async function getRecentRecords(): Promise<RecentRecord[]> {
  const supabase = await createClient()
  const [promisesRes, contractsRes] = await Promise.all([
    supabase.from('promise_records').select('*').order('created_at', { ascending: false }),
    supabase.from('contract_checks').select('*').order('created_at', { ascending: false }),
  ])

  if (promisesRes.error) console.error('读取承诺记录失败:', promisesRes.error)
  if (contractsRes.error) console.error('读取合同体检失败:', contractsRes.error)

  const promiseItems: RecentRecord[] = (promisesRes.data || []).map((row) => {
    const tags = row.tags ? row.tags.split(',').filter(Boolean) : []
    const isAgent = row.person_type === 'agent'
    const personLabel = row.person_type === 'landlord' ? '房东承诺' : isAgent ? '中介沟通' : '其他记录'
    return {
      id: `promise-${row.id}`,
      type: isAgent ? 'agent_communication' : 'promise_record',
      title: tags.length > 0 ? `${personLabel} - ${tags[0]}` : personLabel,
      createdAt: new Date(row.created_at).toLocaleString(),
      createdAtRaw: row.created_at,
    }
  })

  const contractItems: RecentRecord[] = (contractsRes.data || []).map((row) => ({
    id: `contract-${row.id}`,
    type: 'contract_check',
    title: `合同体检 - ${row.file_name}`,
    createdAt: new Date(row.created_at).toLocaleString(),
    createdAtRaw: row.created_at,
    riskLevel: row.risk_level,
  }))

  // 用原始时间戳排序更可靠，再取最近 3 条
  return [...promiseItems, ...contractItems]
    .sort((a, b) => new Date(b.createdAtRaw).getTime() - new Date(a.createdAtRaw).getTime())
    .slice(0, 3)
}

type UpcomingReminder = {
  id: string
  title: string
  remindDate: string
  days: number
}

async function getUpcomingReminders(): Promise<UpcomingReminder[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id)
    .order('remind_date', { ascending: true })

  if (error) {
    console.error('读取提醒失败:', error)
    return []
  }

  // 只显示已过期 + 未来 30 天内的提醒
  return (data || [])
    .map((row) => ({
      id: row.id,
      title: row.title,
      remindDate: row.remind_date,
      days: daysUntilDate(row.remind_date),
    }))
    .filter((r) => r.days <= 30)
}

export default async function HomePage() {
  const [recentRecords, upcomingReminders] = await Promise.all([
    getRecentRecords(),
    getUpcomingReminders(),
  ])

  return (
    <div className="pb-20 px-4">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">租</span>
          </div>
          <span className="text-lg font-bold text-gray-900">租信</span>
        </div>
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-gray-500" />
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <User size={16} className="text-indigo-600" />
          </div>
        </div>
      </div>

      {/* 欢迎卡片 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 mb-5 text-white">
        <h2 className="text-lg font-bold mb-1">Hi，欢迎回来</h2>
        <p className="text-sm text-indigo-100">租房路上，让我们帮你避坑</p>
      </div>

      {/* 近期提醒 */}
      {upcomingReminders.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">近期提醒</h3>
            <Link href="/reminders" className="text-sm text-indigo-600">全部</Link>
          </div>
          <div className="space-y-2">
            {upcomingReminders.map((r) => {
              const overdue = r.days < 0
              const soon = r.days >= 0 && r.days <= 7
              const cardClass = overdue
                ? 'bg-red-50 border-red-200'
                : soon
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white border-gray-100'
              const countdownClass = overdue
                ? 'text-red-600'
                : soon
                ? 'text-amber-600'
                : 'text-gray-400'
              return (
                <Link key={r.id} href="/reminders" className="block">
                  <div className={`border rounded-2xl p-3 flex items-center justify-between shadow-sm ${cardClass}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center shrink-0">
                        <CalendarClock size={14} className={countdownClass} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                        <p className="text-xs text-gray-400">{r.remindDate}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium shrink-0 ml-2 ${countdownClass}`}>
                      {countdownText(r.days)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* 功能入口 */}
      <div className="space-y-3 mb-6">
        <Link href="/check">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">合同体检</p>
                <p className="text-xs text-gray-500">上传合同，AI 帮你找风险</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </Link>

        <Link href="/promise">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Mic size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">记录承诺</p>
                <p className="text-xs text-gray-500">把口头承诺，变成可追溯的记录</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </Link>

        <Link href="/house">
          <div className="bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                <Home size={20} className="text-sky-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">房屋档案</p>
                <p className="text-xs text-gray-500">拍下房屋现状，留作日后凭证</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </Link>

        <Link href="/reminders">
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <CalendarClock size={20} className="text-rose-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">日期提醒</p>
                <p className="text-xs text-gray-500">押金退还、合同到期，关键日期不错过</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </Link>

        <Link href="/records">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Star size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">查看记录</p>
                <p className="text-xs text-gray-500">查看你保存的所有记录</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </Link>
      </div>

      {/* 最近记录 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">最近记录</h3>
          <Link href="/records" className="text-sm text-indigo-600">全部</Link>
        </div>
        <div className="space-y-2">
          {recentRecords.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <p className="text-sm text-gray-400">暂无记录</p>
              <p className="text-xs text-gray-300 mt-1">去做一次合同体检，或记录一条承诺吧</p>
            </div>
          ) : (
            recentRecords.map((record, i) => (
              <Link key={`${record.id}-${i}`} href={`/records/${record.id}`} className="block">
                <div className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm active:scale-[0.99] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      record.type === 'contract_check' ? 'bg-indigo-100' :
                      record.type === 'promise_record' ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {record.type === 'contract_check' ? <FileText size={14} className="text-indigo-600" /> :
                       record.type === 'promise_record' ? <Mic size={14} className="text-green-600" /> :
                       <User size={14} className="text-orange-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{record.title}</p>
                      <p className="text-xs text-gray-400">{record.createdAt}</p>
                    </div>
                  </div>
                  {record.riskLevel === 'high' && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">高风险</span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
      </div>
  )
}