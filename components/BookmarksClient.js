'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function BookmarksClient({ user, initialBookmarks }) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [realtimeStatus, setRealtimeStatus] = useState('connecting')
  const supabase = createClient()
  const router = useRouter()
  const urlInputRef = useRef(null)

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('bookmarks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookmarks((prev) => {
              // Avoid duplicates
              if (prev.find((b) => b.id === payload.new.id)) return prev
              return [payload.new, ...prev]
            })
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        setRealtimeStatus(status === 'SUBSCRIBED' ? 'live' : 'connecting')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
  
    setLoading(true)
    setError('')
  
    let finalUrl = url.trim()
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }
  
    const finalTitle = title.trim() || new URL(finalUrl).hostname
  
    const { data, error: insertError } = await supabase
      .from('bookmarks')
      .insert({ user_id: user.id, url: finalUrl, title: finalTitle })
      .select()  // <-- add this to get the inserted row back
      .single()
  
    if (insertError) {
      setError('Failed to add bookmark. Please try again.')
    } else {
      setUrl('')
      setTitle('')
      // Optimistically add to list immediately
      setBookmarks((prev) => {
        if (prev.find((b) => b.id === data.id)) return prev
        return [data, ...prev]
      })
      urlInputRef.current?.focus()
    }
  
    setLoading(false)
  }

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      setError('Failed to delete bookmark.')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getDomain = (urlStr) => {
    try {
      return new URL(urlStr).hostname.replace('www.', '')
    } catch {
      return urlStr
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] bg-[#0a0a0a] sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 3h14a1 1 0 0 1 1 1v17l-7-3-7 3V4a1 1 0 0 1 1-1z" stroke="#c8f535" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-display font-700 text-sm tracking-tight">
                Smart<span className="text-[#c8f535]">Marks</span>
              </span>
            </div>

            {/* Realtime indicator */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#555] tracking-wider">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  realtimeStatus === 'live'
                    ? 'bg-[#c8f535] animate-pulse-dot'
                    : 'bg-[#444]'
                }`}
              />
              {realtimeStatus === 'live' ? 'LIVE' : 'CONNECTING'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#444] hidden sm:block truncate max-w-[140px]">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-[11px] text-[#555] hover:text-[#c8f535] tracking-wider uppercase transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-2xl font-700 text-[#e8e8e0]">
              Your Bookmarks
            </h1>
            <p className="text-[#444] text-xs mt-0.5 tracking-wide">
              {bookmarks.length} {bookmarks.length === 1 ? 'link' : 'links'} saved
            </p>
          </div>
        </div>

        {/* Add form */}
        <form
          onSubmit={handleAdd}
          className="border border-[#1e1e1e] bg-[#0e0e0e] rounded-sm p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 bg-[#0a0a0a] border border-[#1e1e1e] focus:border-[#c8f535]/40 rounded-sm px-3 py-2.5 text-sm text-[#e8e8e0] placeholder-[#333] outline-none transition-colors font-mono"
              required
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="sm:w-48 bg-[#0a0a0a] border border-[#1e1e1e] focus:border-[#c8f535]/40 rounded-sm px-3 py-2.5 text-sm text-[#e8e8e0] placeholder-[#333] outline-none transition-colors font-mono"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-[#c8f535] hover:bg-[#d4ff3d] disabled:bg-[#1e2a00] disabled:text-[#3a4a10] text-[#0a0a0a] font-display font-600 text-sm px-5 py-2.5 rounded-sm transition-all duration-150 whitespace-nowrap"
            >
              {loading ? '...' : '+ Add'}
            </button>
          </div>
          {error && (
            <p className="text-[#ff5555] text-xs mt-2">{error}</p>
          )}
        </form>

        {/* Bookmark list */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#1a1a1a] rounded-sm">
            <div className="text-4xl mb-3 opacity-20">🔖</div>
            <p className="text-[#333] text-sm">No bookmarks yet.</p>
            <p className="text-[#2a2a2a] text-xs mt-1">Add your first link above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((bookmark, i) => (
              <div
                key={bookmark.id}
                className="group flex items-start gap-3 border border-[#161616] hover:border-[#252525] bg-[#0d0d0d] hover:bg-[#0f0f0f] rounded-sm px-4 py-3.5 transition-all duration-150 animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, animationFillMode: 'backwards' }}
              >
                {/* Favicon */}
                <div className="flex-shrink-0 mt-0.5">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}&sz=32`}
                    alt=""
                    className="w-4 h-4 rounded-sm opacity-70"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-[#d8d8d0] hover:text-[#c8f535] font-display font-500 truncate transition-colors"
                  >
                    {bookmark.title}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-[#3a3a3a] truncate max-w-[200px]">
                      {getDomain(bookmark.url)}
                    </span>
                    <span className="text-[#222] text-[10px]">·</span>
                    <span className="text-[11px] text-[#2e2e2e]">
                      {formatDate(bookmark.created_at)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(bookmark.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-[#333] hover:text-[#ff5555] transition-all duration-150 p-1 rounded-sm"
                  title="Delete bookmark"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
