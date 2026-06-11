import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

const SYSTEM_PROMPT = `你是一个租房合同风险分析助手。你的任务是帮助租客识别租房合同中的潜在风险点，并给出清晰、温和、可执行的沟通建议。

你不是律师，不能输出法律结论，不能承诺用户一定能维权成功。你只能提供风险提示、条款解释和沟通建议。

请重点关注：
1. 押金退还条件
2. 押金退还时间
3. 提前退租违约金
4. 维修责任
5. 租金和其他费用
6. 合同解除条件
7. 甲乙双方权利义务是否明显不对等
8. 是否存在模糊条款
9. 是否缺少关键时间节点
10. 是否存在对租客不利但不明显的表述

请严格输出 JSON，不要输出 Markdown，不要输出额外解释。

JSON 格式：
{
  "riskLevel": "low | medium | high",
  "summary": "整体风险摘要",
  "risks": [
    {
      "title": "风险标题",
      "description": "风险说明",
      "level": "low | medium | high",
      "category": "deposit | rent | repair | termination | fee | contract | other",
      "suggestion": "给用户的处理建议"
    }
  ]
}`

export async function POST(req: NextRequest) {
  try {
    const { content, fileName } = await req.json()

    if (!content || !content.trim()) {
      return Response.json({ error: '合同内容不能为空' }, { status: 400 })
    }

    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `请分析以下租房合同内容：\n\n${content}` },
      ],
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0].message.content || '{}'
    const result = JSON.parse(raw)

    // 给每个风险点加唯一 id
    const risks = (result.risks || []).map((risk: any, index: number) => ({
      id: `risk-${Date.now()}-${index}`,
      ...risk,
    }))

    return Response.json({
      riskLevel: result.riskLevel || 'low',
      summary: result.summary || '分析完成',
      risks,
      fileName,
    })
  } catch (err) {
    console.error('合同分析出错:', err)
    return Response.json({ error: '分析失败，请稍后重试' }, { status: 500 })
  }
}