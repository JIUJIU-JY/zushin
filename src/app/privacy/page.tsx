import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

const sections = [
  {
    title: '你的数据存在哪里',
    body: '你的所有记录都保存在 Supabase 提供的云端数据库中。我们依托其成熟的安全机制来存放数据，不会把你的内容用于与本产品无关的用途。',
  },
  {
    title: '只有你能看到自己的数据',
    body: '每条记录都与你的账号绑定。你需要登录后才能访问，且只能看到属于自己的合同体检、承诺记录、房屋档案与提醒，其他用户无法查看。',
  },
  {
    title: '上传的照片私密存储',
    body: '你上传的证据照片、房屋照片保存在私有存储空间，不会公开。只有在你本人查看时，才会生成有时效的临时链接用于显示。',
  },
  {
    title: '删除',
    body: '你可以随时在对应页面删除自己的记录。删除后该条数据将从你的列表中移除。',
  },
]

export default function PrivacyPage() {
  return (
    <div className="pb-20">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/mine">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">隐私说明</h1>
        <div className="w-5" />
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
          <Shield size={20} className="text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-700 leading-relaxed">
            我们重视你的隐私。以下用朴素的话说明租信如何存放和保护你的数据。
          </p>
        </div>

        {sections.map((s) => (
          <div key={s.title} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-900 mb-1">{s.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{s.body}</p>
          </div>
        ))}

        <p className="text-center text-xs text-gray-300 pt-2">本说明为初版，后续会持续完善。</p>
      </div>
    </div>
  )
}
