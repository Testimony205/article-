'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { recomputeAllVectors } from '@/lib/vectorizer'

export async function rebuildArticleVectors() {
  const user = await getCurrentUser()

  if (!isAdmin(user)) {
    throw new Error('Only admins can rebuild vectors')
  }

  await recomputeAllVectors()
  revalidatePath('/admin')
  revalidatePath('/admin/articles')
  revalidatePath('/admin/system')
}
