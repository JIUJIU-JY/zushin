import { User, Settings, Shield, FileText, HelpCircle, ChevronRight } from 'lucide-react'

export default function MinePage() {
  const menuItems = [
    { icon: FileText, label: '我的合同', desc: '查看所有合同体检记录' },
    { icon: Shield, label: '隐私设置', desc: '管理你的数据和隐私' },
    { icon: Settings, label: '通用设置', desc: '语言、通知等设置' },
    { icon: HelpCircle, label: '帮助与反馈', desc: '常见问题和意见反馈' },
  ]

  return (
    <div className="pb-20 px-4">
      {/* 顶部 */}
      <div className="flex items-center justify-between py-4">
        <h1 className="font-semibold text-gray-900">我的</h1>
        <Settings size={20} className="text-gray-400" />
      </div>

      {/* 用户信息卡片 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 mb-6 text-white flex items-center gap-4">
        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
          <User size={28} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-lg">租房用户</p>
          <p className="text-indigo-100 text-sm">租房路上，不再一个人</p>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '合同体检', value: '1' },
          { label: '承诺记录', value: '3' },
          { label: '收藏记录', value: '1' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-indigo-600">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* 菜单列表 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {menuItems.map(({ icon: Icon, label, desc }, index) => (
          <div
            key={label}
            className={`flex items-center justify-between p-4 ${
              index !== menuItems.length - 1 ? 'border-b border-gray-50' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Icon size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-300 mt-8">租信 v0.1 · 租房路上，不再一个人</p>
    </div>
  )
}