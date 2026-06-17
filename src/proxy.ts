import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 是否带着登录凭据(Supabase 的 sb- 开头 cookie)
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.value)

  const path = request.nextUrl.pathname
  // 这些页面未登录也要能看（登录前需查看条款/隐私/免责声明）
  const isPublic =
    path.startsWith('/login') ||
    path.startsWith('/auth') ||
    path.startsWith('/privacy') ||
    path.startsWith('/terms') ||
    path.startsWith('/disclaimer')

  // 只有"既没读到用户、又根本没有登录凭据"时才弹去登录。
  // 带着 sb- cookie 却这次没读到(令牌刷新的瞬时抖动)→ 放行,避免误弹。
  if (!user && !hasAuthCookie && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}