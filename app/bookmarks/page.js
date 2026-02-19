import { createClient } from '../../lib/supabase-server'
import { redirect } from 'next/navigation'
import BookmarksClient from '../../components/BookmarksClient'

export default async function BookmarksPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <BookmarksClient
      user={user}
      initialBookmarks={bookmarks || []}
    />
  )
}