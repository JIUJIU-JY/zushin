import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const faqs = [
  {
    q: 'AI 分析准吗？',
    a: 'AI 会基于合同文本帮你快速定位常见风险点，覆盖押金、维修、退租等高频条款，适合作为初步参考。但它不能替代专业律师，遇到重大纠纷请咨询专业人士。',
  },
  {
    q: '我的数据安全吗？',
    a: '你的记录和上传的照片都存放在 Supabase，并且只有你本人登录后才能查看自己的数据。照片保存在私有空间，需通过临时签名链接才能访问。',
  },
  {
    q: '怎么导出报告？',
    a: '打开任意一条合同体检记录的详情页，点击「导出图片」，即可把这份体检报告生成为一张长图保存或分享。',
  },
  {
    q: '可以记录房东/中介的口头承诺吗？',
    a: '可以。在「记录承诺」里把对方说过的话记下来，还能附上证据照片，日后需要时随时翻查。',
  },
]

export default function AboutPage() {
  return (
    <div className="pb-20">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/mine">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">关于与帮助</h1>
        <div className="w-5" />
      </div>

      <div className="px-4 space-y-6">
        {/* 产品介绍 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
          <h2 className="text-lg font-bold mb-2">租信</h2>
          <p className="text-sm text-indigo-100 leading-relaxed">
            租信是一款帮租房者避坑的小工具：AI 帮你体检租房合同、把房东和中介的口头承诺变成可追溯的记录、给关键日期设提醒，让你在租房路上更有底气。
          </p>
        </div>

        {/* 常见问题 */}
        <div>
          <h2 className="font-medium text-gray-900 mb-3">常见问题</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-900 mb-1">{faq.q}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-300">租信 v0.1 · 租房路上，不再一个人</p>
      </div>
    </div>
  )
}
