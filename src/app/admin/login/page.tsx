// Server component wrapper — exports dynamic to prevent static pre-rendering.
// The login page calls Supabase which needs runtime env vars.
export const dynamic = 'force-dynamic'

import LoginForm from './LoginForm'

export default function LoginPage() {
  return <LoginForm />
}
