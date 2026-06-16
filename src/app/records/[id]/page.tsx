import Link from 'next/link'
import { ArrowLeft, FileText, Mic, User, Shield, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'
import PhotoGallery from '@/components/photo-gallery'
import ContractReportExport from '@/components/contract-report-export'

export const dynamic = 'force-dynamic'

type RiskLevel = 'high' | 'medium' | 'low'

const riskLabels: Record<RiskLevel, string> = { high: '高风险', medium: '中风险', low: '低风险' }
const riskColors: Record<RiskLevel, string> = {
  high: 'bg-red-50 border-red-200 text-red-600',
  medium: 'bg-orange-50 border-orange-200 text-orange-600',
  low: 'bg-green-50 border-green-200 text-green-600',
}
const riskBadge: Record<RiskLevel, string> = {
  high: 'bg-red-100 text-red-600',
  medium: 'bg-orange-100 text-orange-600',
  low: 'bg-green-100 text-green-600',
}

async function getRecord(id: string) {
    const supabase = await createClient()
  if (id.startsWith('contract-')) {
    const realId = id.replace('contract-', '')
    const { data, error } = await supabase
      .from('contract_checks').select('*').eq('id', realId).single()
    if (error) console.error('读取合同体检详情失败:', error)
    return data ? { kind: 'contract' as const, row: data } : null
  }
  if (id.startsWith('promise-')) {
    const realId = id.replace('promise-', '')
    const { data, error } = await supabase
      .from('promise_records').select('*').eq('id', realId).single()
    if (error) console.error('读取承诺记录详情失败:', error)
    return data ? { kind: 'promise' as const, row: data } : null
  }
  return null
}

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const record = await getRecord(id)

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/records">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">记录详情</h1>
        <div className="w-5" />
      </div>

      {!record ? (
        <div className="text-center py-20 px-4">
          <p className="text-gray-400 font-medium">没有找到这条记录</p>
          <p className="text-xs text-gray-300 mt-1">它可能已被删除</p>
          <Link href="/records">
            <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium">
              返回记录列表
            </button>
          </Link>
        </div>
      ) : record.kind === 'contract' ? (
        <ContractDetail row={record.row} />
      ) : (
        <PromiseDetail row={record.row} />
      )}
    </div>
  )
}

function ContractDetail({ row }: { row: any }) {
  const level: RiskLevel = row.risk_level
  const risks: any[] = Array.isArray(row.risks) ? row.risks : []

  return (
    <div className="px-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <FileText size={18} className="text-indigo-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">合同体检 - {row.file_name}</p>
          <p className="text-xs text-gray-400">{new Date(row.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className={`border rounded-2xl p-4 flex items-center justify-between ${riskColors[level]}`}>
        <div>
          <p className="font-semibold mb-1">风险等级：{riskLabels[level]}</p>
          <p className="text-sm">{row.summary}</p>
        </div>
        <Shield size={28} />
      </div>

      {risks.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">风险点（{risks.length}）</h3>
          <div className="space-y-2">
            {risks.map((risk, i) => (
              <div key={risk.id || i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      size={14}
                      className={
                        risk.level === 'high' ? 'text-red-500' :
                        risk.level === 'medium' ? 'text-orange-500' : 'text-green-500'
                      }
                    />
                    <p className="font-medium text-gray-900 text-sm">{risk.title}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${riskBadge[risk.level as RiskLevel]}`}>
                    {riskLabels[risk.level as RiskLevel]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{risk.description}</p>
                {risk.suggestion && (
                  <p className="text-xs text-indigo-500 bg-indigo-50 rounded-lg px-2 py-1.5 mt-2">
                    💡 {risk.suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ContractReportExport
        fileName={row.file_name}
        createdAt={row.created_at}
        riskLevel={level}
        summary={row.summary}
        risks={risks}
      />

      <p className="text-xs text-gray-400 text-center pt-2">
        AI 分析仅供参考，不构成法律意见。如涉及重大纠纷，请咨询专业律师。
      </p>
    </div>
  )
}

async function PromiseDetail({ row }: { row: any }) {
  const tags: string[] = row.tags ? row.tags.split(',').filter(Boolean) : []
  const isAgent = row.person_type === 'agent'
  const personLabel = row.person_type === 'landlord' ? '房东承诺' : isAgent ? '中介沟通' : '其他记录'
  const Icon = isAgent ? User : Mic
  const iconBg = isAgent ? 'bg-orange-100' : 'bg-green-100'
  const iconColor = isAgent ? 'text-orange-600' : 'text-green-600'

  // 私有桶里的证据图片需要临时签名链接才能显示
  const photoPaths: string[] = Array.isArray(row.photos) ? row.photos : []
  let photoUrls: string[] = []
  if (photoPaths.length > 0) {
    const supabase = await createClient()
    const signed = await Promise.all(
      photoPaths.map((path) => supabase.storage.from('evidence').createSignedUrl(path, 3600))
    )
    photoUrls = signed
      .map((s) => s.data?.signedUrl)
      .filter((url): url is string => Boolean(url))
  }

  return (
    <div className="px-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon size={18} className={iconColor} />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{personLabel}</p>
          <p className="text-xs text-gray-400">{new Date(row.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-gray-400 mb-2">记录内容</p>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{row.content}</p>
      </div>

      {tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {tag}
            </span>
          ))}
        </div>
      )}

      {photoUrls.length > 0 && <PhotoGallery urls={photoUrls} />}
    </div>
  )
}