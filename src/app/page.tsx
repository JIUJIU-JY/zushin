import Link from 'next/link'
import { Bell, User, FileText, Mic, Star, ChevronRight } from 'lucide-react'
import { mockRecords } from '@/lib/mock-data'

export default function HomePage() {
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
          {mockRecords.slice(0, 3).map((record) => (
            <div key={record.id} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
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
          ))}
        </div>
      </div>
    </div>
  )
}