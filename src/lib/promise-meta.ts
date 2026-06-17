// 承诺记录的可选项与小工具，供表单 / 列表 / 详情共用

export const CHANNELS = ['微信', '电话', '当面', '短信', '邮件'] as const
export const ROLES = ['房东', '中介', '室友', '物业'] as const
export const STATUSES = ['未履行', '已履行', '有争议'] as const

// 新的中文身份 -> 旧 person_type（保持列表/详情的图标分类逻辑可用）
export function roleToPersonType(role: string): 'landlord' | 'agent' | 'other' {
  if (role === '房东') return 'landlord'
  if (role === '中介') return 'agent'
  return 'other'
}

// 旧记录没有 counterparty_role 时，用 person_type 回退出一个中文身份
export function personTypeToRole(personType: string): string {
  if (personType === 'landlord') return '房东'
  if (personType === 'agent') return '中介'
  return '其他'
}

// 承诺状态徽章配色：未履行=橙、已履行=绿、有争议=红
export function statusBadge(status: string): string {
  if (status === '已履行') return 'bg-green-100 text-green-600'
  if (status === '有争议') return 'bg-red-100 text-red-600'
  return 'bg-orange-100 text-orange-600'
}
