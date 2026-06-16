import { NextRequest } from 'next/server'

const SYSTEM_PROMPT = `你是「租信」的租房合同风险分析助手，服务对象是中国大陆的租客。你的任务是站在租客一方，审查用户提供的租房合同文本，找出对租客不利或有风险的条款，以及合同中缺失的、本应保护租客的内容。

请严格按下面的 JSON 格式输出，且只输出 JSON 本身：不要任何解释文字，不要用代码块标记，不要有前后缀。

输出格式：
{
  "overallRisk": "低/中/高",
  "summary": "一句话总结，不超过50字",
  "findings": [
    {
      "category": "押金/租金与涨租/违约金/维修责任/提前退租/转租/费用分摊/房屋现状与验收/其他",
      "riskLevel": "低/中/高",
      "originalText": "从合同里一字不差摘录的原文",
      "explanation": "用通俗的话解释为什么对租客不利",
      "suggestion": "给租客的具体建议",
      "confidence": "高/中/低"
    }
  ],
  "missingClauses": [
    { "topic": "缺失的主题", "note": "建议补充什么" }
  ]
}

规则：
1. originalText 必须是合同里真实存在的原文。找不到明确依据就不要写这一条，或把 confidence 设为"低"并在 explanation 里说明。绝不编造原文。
2. 宁可少报，不要夸大风险。把握不大的判断，confidence 一律设为"低"。
3. 你只做风险提示，不下法律结论，不替代律师。
4. 如果用户给的文本根本不是租房合同，findings 和 missingClauses 返回空数组，summary 写"这段文本看起来不是租房合同"。
5. 全程使用简体中文。`

export async function POST(req: NextRequest) {
  try {
    const { contractText, content } = await req.json()
    const text = contractText ?? content

    if (!text || !text.trim()) {
      return Response.json({ error: '合同内容不能为空' }, { status: 400 })
    }

    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 8000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `请分析这份租房合同：\n\n${text}` },
        ],
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('DeepSeek 接口出错:', res.status, detail)
      return Response.json({ error: '分析失败，请稍后重试' }, { status: 500 })
    }

    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content || ''

    let report
    try {
      report = JSON.parse(raw)
    } catch (parseErr) {
      console.error('解析 AI 返回 JSON 失败:', parseErr, raw)
      return Response.json({ error: 'AI 返回格式异常，请稍后重试' }, { status: 500 })
    }

    return Response.json({ report })
  } catch (err) {
    console.error('合同分析出错:', err)
    return Response.json({ error: '分析失败，请稍后重试' }, { status: 500 })
  }
}
