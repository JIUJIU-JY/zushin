import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-server'

// 注销账号：删除当前用户的全部数据 + 存储照片 + auth 账号本身。
// 必须用 service role 密钥（仅服务端），且只允许删“当前登录用户自己”。
export async function POST() {
  // 1) 用 cookie 里的会话确认是谁在操作（绝不接受客户端传来的 userId）
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error('缺少 SUPABASE_SERVICE_ROLE_KEY，无法注销账号')
    return NextResponse.json({ error: '服务端未配置，暂时无法注销' }, { status: 500 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const userId = user.id

  try {
    // 2) 删除 evidence 桶里该用户目录下的所有照片（合同/承诺/房屋档案都存这）
    const { data: files, error: listError } = await admin.storage
      .from('evidence')
      .list(userId, { limit: 1000 })
    if (listError) {
      console.error('列出用户照片失败:', listError)
    } else if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`)
      const { error: removeError } = await admin.storage.from('evidence').remove(paths)
      if (removeError) console.error('删除用户照片失败:', removeError)
    }

    // 3) 删除该用户的所有业务数据
    const tables = ['contract_checks', 'promise_records', 'house_records', 'reminders']
    for (const table of tables) {
      const { error } = await admin.from(table).delete().eq('user_id', userId)
      if (error) console.error(`删除 ${table} 失败:`, error)
    }

    // 4) 删除 auth 账号本身
    const { error: delUserError } = await admin.auth.admin.deleteUser(userId)
    if (delUserError) {
      console.error('删除 auth 账号失败:', delUserError)
      return NextResponse.json({ error: '注销失败，请稍后重试' }, { status: 500 })
    }

    // 5) 让当前会话失效（清 cookie）
    await supabase.auth.signOut()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('注销账号出错:', err)
    return NextResponse.json({ error: '注销失败，请稍后重试' }, { status: 500 })
  }
}
