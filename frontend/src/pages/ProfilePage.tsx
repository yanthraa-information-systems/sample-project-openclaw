import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/services/api'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const updateProfileMutation = useMutation({
    mutationFn: (data: { full_name?: string }) =>
      api.put('/users/me', data).then((r) => r.data),
    onSuccess: (data) => {
      updateUser(data)
      toast.success('Profile updated')
    },
    onError: () => toast.error('Update failed'),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      api.post('/users/me/change-password', data),
    onSuccess: () => {
      toast.success('Password changed')
      setCurrentPassword('')
      setNewPassword('')
    },
    onError: () => toast.error('Password change failed'),
  })

  if (!user) return null

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Profile" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-lg space-y-6">
          {/* Profile info */}
          <div className="rounded-xl border border-surface-700 bg-surface-800 p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={user.full_name || user.username} src={user.avatar_url} size="xl" />
              <div>
                <h2 className="text-xl font-semibold text-white">{user.full_name || user.username}</h2>
                <p className="text-sm text-surface-400">{user.email}</p>
                <Badge variant={user.role === 'admin' ? 'info' : 'default'} className="mt-1">
                  {user.role}
                </Badge>
              </div>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate({ full_name: fullName || undefined }) }}
              className="space-y-4"
            >
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
              <Input label="Username" value={user.username} disabled className="opacity-60 cursor-not-allowed" />
              <Input label="Email" value={user.email} disabled className="opacity-60 cursor-not-allowed" />
              <Button type="submit" isLoading={updateProfileMutation.isPending}>Save Changes</Button>
            </form>
          </div>

          {/* Change password */}
          <div className="rounded-xl border border-surface-700 bg-surface-800 p-6">
            <h3 className="mb-4 font-semibold text-white">Change Password</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                changePasswordMutation.mutate({ current_password: currentPassword, new_password: newPassword })
              }}
              className="space-y-4"
            >
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                required
              />
              <Button type="submit" isLoading={changePasswordMutation.isPending}>
                Update Password
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
