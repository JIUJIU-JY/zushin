'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, SlidersHorizontal, Star, MoreHorizontal, Plus, FileText, Mic, User } from 'lucide-react'
import { mockRecords } from '@/lib/mock-data'
import { RecordItem, RecordType } from '@/lib/types'

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'contract_check', label: '合同体检' },
  { value: 'promise_record', label: '承诺记录' },
] as const

export default function RecordsPage() {
  const [activeTab, setActiveTab] = useState<'all' | RecordType>('all')
  const [keyword, setKeyword] = useState('')
  const [records, setRecords] = useState<RecordItem[]>(mockRecords)

  const filtered = records.filter((r) => {
    const matchTab = activeTab === 'all' || r.type === activeTab
    const matchKeyword = !keyword || r.title.includes(keyword) || r.description.includes(keyword)
    return matchTab && matchKeyword
  })

  function toggleFavorite(id: string) {
    setRecords((prev) =>
      prev.map((r) => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)
    )
  }

  const typeIcon = (type: RecordType) => {
    if (type === 'contract_check') return <FileText size={14} className="text-indigo-600" />
    if (type === 'promise_record') return <Mic size={14} className="text-green-600" />
    return <User size={14} className="text-orange-600" />
  }

  const typeBg = (type: RecordType) => {
    if (type === 'contract_check') return 'bg-indigo-100'
    if (type === 'promise_record') return 'bg-green-100'
    return 'bg-orange-100'
  }

  const typeLabel = (type: RecordType) => {
    if (type === 'contract_check') return { text: '合同体检', color: 'bg-indigo-100 text-indigo-600' }
    if (type === 'promise_record') return { text: '房东承诺', color: 'bg-green-100 text-green-600' }
    return { text: '中介沟通', color: 'bg-orange-100 text-orange-600' }
  }

  return (
    <div className="pb-20">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">我的记录</h1>
        <div className="w-5" />
      </div>

      {/* 筛选 Tab */}
      <div className="flex px-4 mb-4 gap-4 border-b border-gray-100">
        {tabs.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`pb-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === value
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 搜索框 */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
          <Search size={16} className="text-gray-400" />
          <input
            className="flex-1 text-sm outline-none"
            placeholder="搜索记录内容或关键词"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <SlidersHorizontal size={16} className="text-gray-400" />
        </div>
      </div>

      {/* 记录列表 */}
      <div className="px-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">暂无记录</p>
            <p className="text-xs text-gray-300 mt-1">你可以上传合同体检，或记录房东/中介的承诺</p>
            <Link href="/promise">
              <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full text-sm">
                新增记录
              </button>
            </Link>
          </div>
        ) : (
          filtered.map((record) => {
            const label = typeLabel(record.type)
            return (
              <div key={record.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeBg(record.type)}`}>
                      {typeIcon(record.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{record.title}</p>
                      <p className="text-xs text-gray-400">{record.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleFavorite(record.id)}>
                      <Star
                        size={16}
                        className={record.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                      />
                    </button>
                    <MoreHorizontal size={16} className="text-gray-300" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{record.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${label.color}`}>{label.text}</span>
                  {record.riskLevel === 'high' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">高风险</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 悬浮新增按钮 */}
      <Link href="/promise">
        <button className="fixed bottom-20 right-6 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center">
          <Plus size={20} />
        </button>
      </Link>
    </div>
  )
}