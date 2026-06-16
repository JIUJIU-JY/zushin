'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, X, Shield, AlertTriangle } from 'lucide-react'
import { ContractReport } from '@/lib/types'

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  // 用与所装版本匹配的 worker（从 CDN 加载，避免打包器配置麻烦）
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
    fullText += pageText + '\n'
  }
  return fullText.trim()
}

async function extractDocxText(file: File): Promise<string> {
  const mod = await import('mammoth')
  const mammoth = (mod as any).default || mod
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value.trim()
}
export default function CheckPage() {
  const [file, setFile] = useState<File | null>(null)
  const [contractText, setContractText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [report, setReport] = useState<ContractReport | null>(null)
  const [error, setError] = useState('')
  const [extracting, setExtracting] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    if (f.size > 20 * 1024 * 1024) {
      setError('文件不能超过 20MB')
      return
    }

    setFile(f)
    setError('')

    const name = f.name.toLowerCase()

    try {
      if (f.type === 'text/plain' || name.endsWith('.txt')) {
        setContractText(await f.text())
      } else if (name.endsWith('.pdf')) {
        setExtracting(true)
        const text = await extractPdfText(f)
        if (text.trim()) {
          setContractText(text)
        } else {
          setError('这个 PDF 像是扫描件/图片，提取不到文字，请手动粘贴合同文本')
        }
      } else if (name.endsWith('.docx')) {
        setExtracting(true)
        setContractText(await extractDocxText(f))
      } else if (name.endsWith('.doc')) {
        setError('暂不支持旧版 .doc，请用 Word 另存为 .docx 或 PDF，或手动粘贴文本')
      } else {
        setError('该格式暂不支持自动提取，请手动粘贴合同文本')
      }
    } catch (err) {
      console.error('提取文件文本失败:', err)
      setError('文件内容提取失败，请尝试手动粘贴文本')
    } finally {
      setExtracting(false)
    }
  }

  async function handleAnalyze() {
    if (!contractText.trim()) {
      setError('请粘贴合同文本内容')
      return
    }

    setError('')
    setAnalyzing(true)
    setReport(null)

    try {
      const res = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractText: contractText }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '分析失败，请稍后重试')
        return
      }

      setReport(data.report)
    } catch (err) {
      setError('分析失败，请稍后重试')
    } finally {
      setAnalyzing(false)
    }
  }

  // 综合风险徽章配色（入参为中文"高/中/低"）
  const riskStyle = (level: string) => {
    if (level === '高') return 'bg-red-50 border-red-200 text-red-600'
    if (level === '中') return 'bg-amber-50 border-amber-200 text-amber-600'
    return 'bg-green-50 border-green-200 text-green-600'
  }

  // findings 卡片里小标签的配色
  const riskTagStyle = (level: string) => {
    if (level === '高') return 'bg-red-100 text-red-600'
    if (level === '中') return 'bg-amber-100 text-amber-600'
    return 'bg-green-100 text-green-600'
  }

  const riskIconColor = (level: string) => {
    if (level === '高') return 'text-red-500'
    if (level === '中') return 'text-amber-500'
    return 'text-green-500'
  }

  return (
    <div className="pb-20">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">合同体检</h1>
        <Link href="/records" className="text-sm text-indigo-600">历史记录</Link>
      </div>

      <div className="px-4 space-y-4">
        {/* 上传区域（用于附带文件名展示） */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">上传合同（可选）</h2>
          {!file ? (
            <label className="block border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center bg-indigo-50 cursor-pointer">
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.jpg,.png" onChange={handleFileChange} />
              <Upload size={28} className="text-indigo-400 mx-auto mb-2" />
              <p className="text-indigo-600 font-medium mb-1 text-sm">点击上传合同</p>
              <p className="text-xs text-gray-400">支持 PDF / 图片 / Word / 纯文本</p>
              <p className="text-xs text-gray-400">文件不超过 20MB</p>
            </label>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <FileText size={18} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)}MB</p>
                </div>
              </div>
              <button onClick={() => { setFile(null) }}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>
          )}
        </div>

        {/* 合同文本输入 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">合同文本内容</h2>
          <textarea
            className="w-full border border-gray-200 rounded-2xl p-3 text-sm resize-none bg-white h-40"
            placeholder="粘贴合同文字，或在上方上传 PDF / Word / 纯文本，自动提取内容。（图片暂不支持自动提取，请手动粘贴）"
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
          />
        </div>

        {extracting && (
          <p className="text-xs text-indigo-500 mt-2">正在从文件中提取文字，请稍候...</p>
        )}
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {/* 分析按钮 */}
        <button
          onClick={handleAnalyze}
          disabled={!contractText.trim() || analyzing}
          className={`w-full py-3 rounded-2xl font-medium text-white ${
            !contractText.trim() ? 'bg-gray-300' : 'bg-gradient-to-r from-indigo-500 to-purple-600'
          }`}
        >
          {analyzing ? '分析中...' : '开始 AI 分析'}
        </button>

        {analyzing && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">正在分析合同风险...</p>
            <p className="text-xs text-gray-400 mt-1">通常需要 10-30 秒</p>
          </div>
        )}

        {/* 分析结果 */}
        {report && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-gray-900">体检结果</h2>
              <span className="text-xs text-gray-400">
                体检时间：{new Date().toLocaleString()}
              </span>
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
            {report.findings && report.findings.length > 0 ? (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">风险发现（{report.findings.length}）</h3>
                <div className="space-y-2">
                  {report.findings.map((f, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
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
            {report.missingClauses && report.missingClauses.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">合同里缺失的保护条款</h3>
                <div className="space-y-2">
                  {report.missingClauses.map((m, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                      <p className="text-sm font-medium text-gray-900 mb-1">{m.topic}</p>
                      <p className="text-xs text-gray-500">{m.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 保存功能升级中（暂禁用） */}
            <button
              disabled
              className="w-full py-3 rounded-2xl font-medium text-sm border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
            >
              保存功能升级中
            </button>

            <p className="text-xs text-gray-400 text-center pb-4">
              本报告由 AI 生成，仅供参考，不构成法律意见。涉及重大权益时请咨询专业律师。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}