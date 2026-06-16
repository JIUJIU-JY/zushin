// 纯日期（按本地零点）比较，避免时分秒/时区影响倒计时
export function daysUntilDate(dateStr: string): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  const target = new Date(y, m - 1, d)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export function countdownText(days: number): string {
  if (days === 0) return '今天'
  if (days > 0) return `还有 ${days} 天`
  return `已过期 ${Math.abs(days)} 天`
}
