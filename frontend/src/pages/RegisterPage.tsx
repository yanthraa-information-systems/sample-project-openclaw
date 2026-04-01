import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', full_name: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const { register, isRegistering } = useAuth()

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    register({
      email: form.email,
      username: form.username,
      full_name: form.full_name || undefined,
      password: form.password,
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-950 px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/20 border border-brand-500/30">
            <span className="text-2xl font-bold text-brand-400">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="mt-1 text-sm text-surface-400">Get started with AI Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name (optional)"
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
            placeholder="John Doe"
            leftIcon={<User className="h-4 w-4" />}
          />
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => update('username', e.target.value)}
            placeholder="johndoe"
            leftIcon={<User className="h-4 w-4" />}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            required
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              leftIcon={<Lock className="h-4 w-4" />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-surface-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Button type="submit" isLoading={isRegistering} className="w-full" size="lg">
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
