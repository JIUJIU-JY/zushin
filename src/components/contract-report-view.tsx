'use client'

import Link from 'next/link'
import { Shield, AlertTriangle, Printer } from 'lucide-react'
import { ContractReport } from '@/lib/types'

// 新报告用中文"高/中/低"，下面是对应配色
const riskStyle = (level: string) =>
  level === '高' ? 'bg-red-50 border-red-200 text-red-600'
  : level === '中' ? 'bg-amber-50 border-amber-200 text-amber-600'
  : 'bg-green-50 border-green-200 text-green-600'
const riskTagStyle = (level: string) =>
  level === '高' ? 'bg-red-100 text-red-600'
  : level === '中' ? 'bg-amber-100 text-amber-600'
  : 'bg-green-100 text-green-600'
const riskIconColor = (level: string) =>
  level === '高' ? 'text-red-500' : level === '中' ? 'text-amber-500' : 'text-green-500'

export default function ContractReportView({
  report,
  fileName,
  createdAt,
}: {
  report: ContractReport
  fileName?: string
  createdAt?: string
}) {
  const timeText = createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString()
  const findings = Array.isArray(report.findings) ? report.findings : []
  const missingClauses = Array.isArray(report.missingClauses) ? report.missingClauses : []

  return (
    <div className="space-y-4">
      {/* 导出按钮（打印时隐藏） */}
      <div className="flex justify-end no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-indigo-200 text-indigo-600 font-medium"
        >
          <Printer size={14} /> 导出 PDF
        </button>
      </div>

      {/* 报告正文（打印只保留这块） */}
      <div id="contract-report" className="space-y-4">
        {/* 报告抬头 */}
        <div className="border-b border-gray-100 pb-3">
          <p className="font-semibold text-gray-900">租信 · 合同体检报告</p>
          {fileName && <p className="text-xs text-gray-500 mt-1">合同：{fileName}</p>}
          <p className="text-xs text-gray-400 mt-0.5">体检时间：{timeText}</p>
        </div>

        {/* 综合风险徽章 */}
        <div className={`border rounded-2xl p-4 flex items-center justify-between ${riskStyle(report.overallRisk)}`}>
          <div>
            <p className="font-semibold mb-1">综合风险：{report.overallRisk}风险</p>
            <p className="text-sm">{report.summary}</p>
          </div>
          <Shield size={28} />
        </div>

        {/* 风险发现卡片 */}
        {findings.length > 0 ? (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">风险发现（{findings.length}）</h3>
            <div className="space-y-2">
              {findings.map((f, i) => (
                <div key={i} className="report-card bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className={riskIconColor(f.riskLevel)} />
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{f.category}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${riskTagStyle(f.riskLevel)}`}>
                      {f.riskLevel}风险
                    </span>
                  </div>

                  {f.originalText && (
                    <blockquote className="border-l-2 border-gray-300 bg-gray-50 text-gray-600 italic text-xs rounded-r-lg px-3 py-2 mb-2">
                      “{f.originalText}”
                    </blockquote>
                  )}

                  <p className="text-xs text-gray-500 mb-1">{f.explanation}</p>

                  {f.suggestion && (
                    <p className="text-xs text-indigo-500 bg-indigo-50 rounded-lg px-2 py-1.5 mt-2">
                      💡 {f.suggestion}
                    </p>
                  )}

                  {f.confidence === '低' && (
                    <p className="text-xs text-amber-600 mt-2">⚠️ AI 对这条不太确定，建议人工核对</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">未发现明显风险点（也可能这段文本并不是租房合同）。</p>
        )}

        {/* 缺失的保护条款 */}
        {missingClauses.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">合同里缺失的保护条款</h3>
            <div className="space-y-2">
              {missingClauses.map((m, i) => (
                <div key={i} className="report-card bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-900 mb-1">{m.topic}</p>
                  <p className="text-xs text-gray-500">{m.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center pt-2">
          本报告由 AI 生成，仅供参考，不构成法律意见。涉及重大权益时请咨询专业律师。
          <Link href="/disclaimer" className="text-indigo-500 ml-1 no-print">查看完整免责声明</Link>
        </p>
      </div>
    </div>
  )
}
