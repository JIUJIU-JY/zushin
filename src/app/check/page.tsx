'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, X } from 'lucide-react'
import { ContractReport } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import ContractReportView from '@/components/contract-report-view'

// 新报告的中文综合风险转成库里 risk_level 用的英文，列表页/旧详情页才能正常识别
const overallRiskToLevel = (r: string) => (r === '高' ? 'high' : r === '中' ? 'medium' : 'low')

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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
    setSaved(false)

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

  async function handleSaveResult() {
    if (!report) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      setError('请先登录再保存')
      return
    }

    const { error: saveError } = await supabase.from('contract_checks').insert({
      file_name: file?.name || '合同文本',
      risk_level: overallRiskToLevel(report.overallRisk),
      summary: report.summary,
      report: report,
      user_id: user.id,
    })

    setSaving(false)
    if (saveError) {
      console.error('保存失败:', saveError)
      setError('保存失败:' + saveError.message)
      return
    }
    setSaved(true)
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
            <ContractReportView report={report} fileName={file?.name} />

            {/* 保存到我的记录（屏幕显示，打印时隐藏） */}
            <div className="no-print space-y-4">
              <button
                onClick={handleSaveResult}
                disabled={saving || saved}
                className={`w-full py-3 rounded-2xl font-medium text-sm border ${
                  saved
                    ? 'border-green-200 bg-green-50 text-green-600'
                    : 'border-indigo-200 text-indigo-600'
                }`}
              >
                {saved ? '✓ 已保存到我的记录' : saving ? '保存中...' : '保存到我的记录'}
              </button>
              {saved && (
                <Link href="/records" className="block text-center text-sm text-indigo-600 font-medium pb-4">
                  去看看记录 →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}