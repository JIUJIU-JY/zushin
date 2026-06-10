'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, X, Shield, ChevronRight, AlertTriangle } from 'lucide-react'
import { mockContractCheck } from '@/lib/mock-data'
import { RiskLevel } from '@/lib/types'

export default function CheckPage() {
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<typeof mockContractCheck | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  async function handleAnalyze() {
    if (!file) return
    setAnalyzing(true)
    await new Promise((r) => setTimeout(r, 2000))
    setResult(mockContractCheck)
    setAnalyzing(false)
  }

  const riskColors: Record<RiskLevel, string> = {
    high: 'bg-red-50 border-red-200 text-red-600',
    medium: 'bg-orange-50 border-orange-200 text-orange-600',
    low: 'bg-green-50 border-green-200 text-green-600',
  }

  const riskLabels: Record<RiskLevel, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  }

  return (
    <div className="pb-20">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">合同体检</h1>
        <span className="text-sm text-indigo-600">历史记录</span>
      </div>

      <div className="px-4 space-y-4">
        {/* 上传区域 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">上传合同</h2>
          {!file ? (
            <label className="block border-2 border-dashed border-indigo-200 rounded-2xl p-8 text-center bg-indigo-50 cursor-pointer">
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.jpg,.png" onChange={handleFileChange} />
              <Upload size={32} className="text-indigo-400 mx-auto mb-3" />
              <p className="text-indigo-600 font-medium mb-1">点击上传合同</p>
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
              <button onClick={() => { setFile(null); setResult(null) }}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>
          )}
        </div>

        {/* 分析按钮 */}
        <button
          onClick={handleAnalyze}
          disabled={!file || analyzing}
          className={`w-full py-3 rounded-2xl font-medium text-white ${
            !file ? 'bg-gray-300' : 'bg-gradient-to-r from-indigo-500 to-purple-600'
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
        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-gray-900">体检结果</h2>
              <span className="text-xs text-gray-400">体检时间：{result.createdAt}</span>
            </div>

            {/* 风险等级 */}
            <div className={`border rounded-2xl p-4 flex items-center justify-between ${riskColors[result.riskLevel]}`}>
              <div>
                <p className="font-semibold mb-1">风险等级：{riskLabels[result.riskLevel]}</p>
                <p className="text-sm">{result.summary}</p>
              </div>
              <Shield size={28} />
            </div>

            {/* 风险点列表 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">风险点（{result.risks.length}）</h3>
              <div className="space-y-2">
                {result.risks.map((risk) => (
                  <div key={risk.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className={risk.level === 'high' ? 'text-red-500' : 'text-orange-500'} />
                        <p className="font-medium text-gray-900 text-sm">{risk.title}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          risk.level === 'high' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                        }`}>{riskLabels[risk.level]}</span>
                        <ChevronRight size={14} className="text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{risk.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full py-3 border border-indigo-200 rounded-2xl text-indigo-600 font-medium text-sm">
              查看详细分析报告
            </button>

            <p className="text-xs text-gray-400 text-center pb-4">
              AI 分析仅供参考，不构成法律意见。如涉及重大纠纷，请咨询专业律师。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}