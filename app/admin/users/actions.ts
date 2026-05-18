'use server'

import { revalidatePath } from 'next/cache'
import { query } from '@/lib/db'
import { getCurrentUser, isAdmin } from '@/lib/auth'

export async function setUserRole(formData: FormData) {
  const currentUser = await getCurrentUser()

  if (!isAdmin(currentUser)) {
    throw new Error('Only admins can update user roles')
  }

  const userId = Number(formData.get('userId'))
  const role = formData.get('role')

  if (!userId || (role !== 'user' && role !== 'admin')) {
    throw new Error('Invalid role update')
  }

  if (currentUser?.id === userId && role === 'user') {
    throw new Error('Admins cannot remove their own admin access')
  }

  await query(`
    UPDATE users
    SET role = ?
    WHERE id = ?
  `, [role, userId])

  revalidatePath('/admin/users')
  revalidatePath('/admin')
}
