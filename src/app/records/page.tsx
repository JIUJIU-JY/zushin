'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Search, SlidersHorizontal, Star, MoreHorizontal,
  Plus, FileText, Mic, User, X, Inbox,Trash2
} from 'lucide-react'
import { RecordItem, RecordType, RiskLevel } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { personTypeToRole, statusBadge } from '@/lib/promise-meta'

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'contract_check', label: '合同体检' },
  { value: 'promise_record', label: '承诺记录' },
] as const

const FILTER_TAGS = ['押金', '退租', '维修', '租金', '费用', '合同', '其他']
const RISK_LEVELS: { value: RiskLevel; label: string }[] = [
  { value: 'high', label: '高风险' },
  { value: 'medium', label: '中风险' },
  { value: 'low', label: '低风险' },
]

export default function RecordsPage() {
  const [activeTab, setActiveTab] = useState<'all' | RecordType>('all')
  const [keyword, setKeyword] = useState('')
  const [records, setRecords] = useState<RecordItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 筛选面板
  const [showFilter, setShowFilter] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RecordItem | null>(null)
  const [filterRisk, setFilterRisk] = useState<RiskLevel | null>(null)
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [filterFavoriteOnly, setFilterFavoriteOnly] = useState(false)
  async function fetchRecords() {
    setLoading(true)

    const [promisesRes, contractsRes] = await Promise.all([
      supabase.from('promise_records').select('*').order('created_at', { ascending: false }),
      supabase.from('contract_checks').select('*').order('created_at', { ascending: false }),
    ])
    if (promisesRes.error) console.error('读取承诺记录失败:', promisesRes.error)
    if (contractsRes.error) console.error('读取合同体检失败:', contractsRes.error)

    const promiseItems: RecordItem[] = (promisesRes.data || []).map((row) => {
      const tags = row.tags ? row.tags.split(',').filter(Boolean) : []
      const isAgent = row.person_type === 'agent'
      const personLabel = row.person_type === 'landlord' ? '房东承诺' : isAgent ? '中介沟通' : '其他记录'

      return {
        id: `promise-${row.id}`,
        type: isAgent ? 'agent_communication' : 'promise_record',
        title: tags.length > 0 ? `${personLabel} - ${tags[0]}` : personLabel,
        description: row.content,
        tags,
        createdAt: new Date(row.created_at).toLocaleString(),
        isFavorite: row.is_favorite,
        status: row.status || '未履行',
        counterpartyRole: row.counterparty_role || personTypeToRole(row.person_type),
        promisedAt: row.promised_at ? new Date(row.promised_at).toLocaleString() : '',
      }
    })

    const contractItems: RecordItem[] = (contractsRes.data || []).map((row) => ({
      id: `contract-${row.id}`,
      type: 'contract_check',
      title: `合同体检 - ${row.file_name}`,
      description: row.summary,
      tags: [],
      createdAt: new Date(row.created_at).toLocaleString(),
      riskLevel: row.risk_level as RiskLevel,
      isFavorite: row.is_favorite ?? false,
    }))

    const all = [...promiseItems, ...contractItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    setRecords(all)
    setLoading(false)
  }

  useEffect(() => {
    fetchRecords()
  }, [])
// 从网址参数读取初始筛选（从"我的"页统计卡片跳转过来时用）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab === 'contract_check' || tab === 'promise_record') {
      setActiveTab(tab)
    }
    if (params.get('fav') === '1') {
      setFilterFavoriteOnly(true)
    }
  }, [])
  function toggleFilterTag(tag: string) {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function resetFilters() {
    setFilterRisk(null)
    setFilterTags([])
    setFilterFavoriteOnly(false)
  }

  const hasActiveFilter = !!filterRisk || filterTags.length > 0 || filterFavoriteOnly

  const filtered = records.filter((r) => {
    const matchTab = activeTab === 'all' || r.type === activeTab
    const matchKeyword =
      !keyword ||
      r.title.includes(keyword) ||
      r.description.includes(keyword) ||
      r.tags.some((t) => t.includes(keyword))
    const matchRisk = !filterRisk || r.riskLevel === filterRisk
    const matchTags = filterTags.length === 0 || filterTags.some((t) => r.tags.includes(t))
    const matchFavorite = !filterFavoriteOnly || r.isFavorite
    return matchTab && matchKeyword && matchRisk && matchTags && matchFavorite
  })

    async function toggleFavorite(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const record = records.find((r) => r.id === id)
    if (!record) return
    const newValue = !record.isFavorite

    // 先乐观更新界面（点了立刻有反应）
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: newValue } : r))
    )

    // 再写入数据库
    let dbError = null
    if (id.startsWith('promise-')) {
      const realId = id.replace('promise-', '')
      const { error } = await supabase
        .from('promise_records')
        .update({ is_favorite: newValue })
        .eq('id', realId)
      dbError = error
    } else if (id.startsWith('contract-')) {
      const realId = id.replace('contract-', '')
      const { error } = await supabase
        .from('contract_checks')
        .update({ is_favorite: newValue })
        .eq('id', realId)
      dbError = error
    }

    // 写库失败就把界面回滚
    if (dbError) {
      console.error('更新收藏状态失败:', dbError)
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isFavorite: !newValue } : r))
      )
    }
  }
    async function handleDelete(record: RecordItem) {
    const id = record.id
    let error = null

   if (id.startsWith('contract-')) {
    const realId = id.replace('contract-', '')
    const res = await supabase.from('contract_checks').delete().eq('id', realId)
    error = res.error
  } else if (id.startsWith('promise-')) {
    const realId = id.replace('promise-', '')
    const res = await supabase.from('promise_records').delete().eq('id', realId)
    error = res.error
  }

  if (error) {
    alert('删除失败,请重试')
    return
  }

  setRecords((prev) => prev.filter((r) => r.id !== id))
  setDeleteTarget(null)
}
  function handleCardClick(record: RecordItem) {
  router.push(`/records/${record.id}`)
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

  const riskLabel = (level: RiskLevel) => {
    if (level === 'high') return { text: '高风险', color: 'bg-red-100 text-red-600' }
    if (level === 'medium') return { text: '中风险', color: 'bg-orange-100 text-orange-600' }
    return { text: '低风险', color: 'bg-green-100 text-green-600' }
  }

  const isEmpty = records.length === 0
  const isNoResult = !isEmpty && filtered.length === 0

  return (
    <div className="pb-24 relative">
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

      {/* 搜索框 + 筛选按钮 */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
            placeholder="搜索记录内容或关键词"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {keyword && (
            <button onClick={() => setKeyword('')}>
              <X size={14} className="text-gray-300" />
            </button>
          )}
          <button onClick={() => setShowFilter(true)} className="relative shrink-0">
            <SlidersHorizontal
              size={16}
              className={hasActiveFilter ? 'text-indigo-600' : 'text-gray-400'}
            />
            {hasActiveFilter && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="px-4 space-y-3">
        {loading && (
    <div className="text-center py-16">
      <p className="text-gray-400 text-sm">加载中...</p>
    </div>
    )}

    {!loading && isEmpty && (
          <div className="text-center py-16">
            <Inbox size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">暂无记录</p>
            <p className="text-xs text-gray-300 mt-1 px-8">
              你可以上传合同体检，或记录房东/中介的承诺
            </p>
            <Link href="/promise">
              <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium">
                新增记录
              </button>
            </Link>
          </div>
        )}

        {!loading && isNoResult && (
          <div className="text-center py-16">
            <Search size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">没有找到相关记录</p>
            <p className="text-xs text-gray-300 mt-1 px-8">
              试试更换关键词，或调整筛选条件
            </p>
            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                className="mt-4 px-6 py-2 border border-indigo-200 text-indigo-600 rounded-full text-sm font-medium"
              >
                清除筛选条件
              </button>
            )}
          </div>
        )}

        {!loading && !isEmpty &&
          filtered.map((record) => {
            const label = typeLabel(record.type)
            return (
              <div
                key={record.id}
                onClick={() => handleCardClick(record)}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeBg(record.type)}`}>
                      {typeIcon(record.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{record.title}</p>
                      <p className="text-xs text-gray-400">{record.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={(e) => toggleFavorite(record.id, e)}
                      className="p-1 -m-1"
                    >
                      <Star
                        size={16}
                        className={record.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                      />
                    </button>
                    <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(record) }}
                      className="p-1 -m-1"
>
                     <MoreHorizontal size={16} className="text-gray-300" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
                  {record.description}
                </p>
                {record.type !== 'contract_check' && (record.counterpartyRole || record.promisedAt) && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 flex-wrap">
                    {record.counterpartyRole && <span>{record.counterpartyRole}</span>}
                    {record.promisedAt && <span>· 承诺时间 {record.promisedAt}</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${label.color}`}>
                    {label.text}
                  </span>
                  {record.type !== 'contract_check' && record.status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(record.status)}`}>
                      {record.status}
                    </span>
                  )}
                  {record.riskLevel && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskLabel(record.riskLevel).color}`}>
                      {riskLabel(record.riskLevel).text}
                    </span>
                  )}
                  {record.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
      </div>

      {/* 悬浮新增按钮 */}
      <Link href="/promise">
        <button className="fixed bottom-20 right-6 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center z-40">
          <Plus size={20} />
        </button>
      </Link>

      {/* 筛选面板 */}
      {showFilter && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowFilter(false)}
          />
          <div className="relative w-full max-w-[390px] bg-white rounded-t-3xl p-5 pb-12 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">筛选</h3>
              <button onClick={() => setShowFilter(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* 风险等级 */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-900 mb-2">风险等级</p>
              <div className="flex gap-2 flex-wrap">
                {RISK_LEVELS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilterRisk(filterRisk === value ? null : value)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      filterRisk === value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 标签 */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-900 mb-2">标签</p>
              <div className="flex gap-2 flex-wrap">
                {FILTER_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleFilterTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      filterTags.includes(tag)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 是否收藏 */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-900 mb-2">收藏</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterFavoriteOnly(false)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    !filterFavoriteOnly
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFilterFavoriteOnly(true)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    filterFavoriteOnly
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  已收藏
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-medium"
              >
                重置
              </button>
              <button
                onClick={() => setShowFilter(false)}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-medium"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 删除确认 */}
              {deleteTarget && (
         <div className="fixed inset-0 z-[70] flex items-end justify-center">
         <div
          className="absolute inset-0 bg-black/30"
          onClick={() => setDeleteTarget(null)}
           />
          <div className="relative w-full max-w-[390px] bg-white rounded-t-3xl p-5 pb-10">
          <div className="text-center mb-5">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <p className="font-semibold text-gray-900">删除这条记录?</p>
        <p className="text-sm text-gray-400 mt-1 truncate px-4">{deleteTarget.title}</p>
        <p className="text-xs text-gray-300 mt-1">删除后无法恢复</p>
        </div>
        <div className="flex gap-3">
         <button
          onClick={() => setDeleteTarget(null)}
          className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-medium"
        >
          取消
        </button>
        <button
          onClick={() => handleDelete(deleteTarget)}
          className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-medium"
        >
          删除
        </button>
      </div>
    </div>
  </div>
         )}
    </div>
  )
}