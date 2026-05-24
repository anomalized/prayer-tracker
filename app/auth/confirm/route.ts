import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUserProfile } from '@/lib/actions/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard/today'

  let error = null

  if (token_hash && type) {
    const supabase = createClient()
    const { error: otpError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    error = otpError
  } else if (code) {
    const supabase = createClient()
    const { error: codeError } = await supabase.auth.exchangeCodeForSession(code)
    error = codeError
  } else {
    return NextResponse.redirect(new URL('/auth/magiclink?error=Invalid_link', request.url))
  }

  if (!error) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Ensure profile exists for the newly logged in user
      await createUserProfile(
        user.id, 
        user.user_metadata?.full_name || user.email?.split("@")[0] || "User", 
        user.email || ""
      )
    }
    
    return NextResponse.redirect(new URL(next, request.url))
  }

  return NextResponse.redirect(new URL('/auth/magiclink?error=Invalid_link', request.url))
}
