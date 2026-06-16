'use client'

import { useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { RiskLevel, RiskItem } from '@/lib/types'

type Props = {
  fileName: string
  createdAt: string
  riskLevel: RiskLevel
  summary: string
  risks: RiskItem[]
}

const riskLabels: Record<RiskLevel, string> = { high: '高风险', medium: '中风险', low: '低风险' }

// 导出版式用固定 hex 颜色，配色清晰、可控，且不依赖页面里的 oklch 变量
const riskStyles: Record<RiskLevel, { bg: string; border: string; text: string; badgeBg: string }> = {
  high: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', badgeBg: '#fee2e2' },
  medium: { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c', badgeBg: '#ffedd5' },
  low: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', badgeBg: '#dcfce7' },
}

export default function ContractReportExport({ fileName, createdAt, riskLevel, summary, risks }: Props) {
  const exportRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  async function handleExport() {
    if (!exportRef.current) return
    setError('')
    setExporting(true)
    try {
      // html2canvas-pro 支持 oklch（本项目 Tailwind 颜色用的就是 oklch），普通 html2canvas 会报错/发白
      const { default: html2canvas } = await import('html2canvas-pro')
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      })
      const dataUrl = canvas.toDataURL('image/png')
      const date = new Date(createdAt).toLocaleDateString('zh-CN').replace(/\//g, '-')
      const link = document.createElement('a')
      link.download = `${fileName}-合同体检报告-${date}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('导出图片失败:', err)
      setError('导出失败:' + (err instanceof Error ? err.message : '请稍后重试'))
    } finally {
      setExporting(false)
    }
  }

  const banner = riskStyles[riskLevel]

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full py-3 rounded-2xl font-medium text-sm border border-indigo-200 text-indigo-600 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <Download size={16} />
        {exporting ? '生成中...' : '导出图片'}
      </button>
      {error && <p className="text-sm text-red-500 text-center mt-2">{error}</p>}

      {/* 导出版式：离屏渲染，仅供 html2canvas 截图，不在页面上显示 */}
      <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }} aria-hidden>
        <div
          ref={exportRef}
          style={{
            width: 600,
            boxSizing: 'border-box',
            background: '#ffffff',
            padding: 40,
            fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
            color: '#1f2937',
          }}
        >
          {/* 标题 */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>合同体检报告</p>
            <p style={{ fontSize: 15, color: '#374151', margin: '10px 0 0' }}>{fileName}</p>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>
              体检时间：{new Date(createdAt).toLocaleString('zh-CN')}
            </p>
          </div>

          {/* 风险等级 + 整体摘要 */}
          <div
            style={{
              background: banner.bg,
              border: `1px solid ${banner.border}`,
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <p style={{ fontSize: 17, fontWeight: 600, color: banner.text, margin: 0 }}>
              风险等级：{riskLabels[riskLevel]}
            </p>
            {summary && (
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: '10px 0 0' }}>{summary}</p>
            )}
          </div>

          {/* 风险点 */}
          {risks.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: '0 0 12px' }}>
                风险点（{risks.length}）
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {risks.map((risk, i) => {
                  const rs = riskStyles[risk.level]
                  return (
                    <div
                      key={risk.id || i}
                      style={{
                        border: '1px solid #f3f4f6',
                        borderRadius: 14,
                        padding: 16,
                        background: '#ffffff',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>{risk.title}</p>
                        <span
                          style={{
                            fontSize: 12,
                            color: rs.text,
                            background: rs.badgeBg,
                            borderRadius: 999,
                            padding: '2px 10px',
                            whiteSpace: 'nowrap',
                            marginLeft: 8,
                          }}
                        >
                          {riskLabels[risk.level]}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>{risk.description}</p>
                      {risk.suggestion && (
                        <p
                          style={{
                            fontSize: 13,
                            color: '#4f46e5',
                            background: '#eef2ff',
                            borderRadius: 10,
                            padding: '8px 10px',
                            lineHeight: 1.6,
                            margin: '10px 0 0',
                          }}
                        >
                          💡 {risk.suggestion}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 免责声明 */}
          <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
            本报告由 AI 生成，仅供参考，不构成法律意见。
          </p>
        </div>
      </div>
    </div>
  )
}
