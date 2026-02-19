import { createClient } from '../lib/supabase-server'
import LoginButton from '../components/LoginButton'

export default async function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(#c8f535 1px, transparent 1px), linear-gradient(90deg, #c8f535 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#c8f535] opacity-[0.03] blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-md w-full">
        {/* Logo mark */}
        <div className="inline-flex items-center justify-center w-16 h-16 border border-[#c8f535]/30 rounded-sm mb-8 bg-[#c8f535]/5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M5 3h14a1 1 0 0 1 1 1v17l-7-3-7 3V4a1 1 0 0 1 1-1z" stroke="#c8f535" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 8h6M9 12h4" stroke="#c8f535" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 className="font-display text-4xl font-800 tracking-tight text-[#e8e8e0] mb-2">
          Smart<span className="text-[#c8f535]">Marks</span>
        </h1>
        <p className="text-[#666660] text-sm mb-10 tracking-widest uppercase">
          Personal bookmark manager
        </p>

        <div className="border border-[#222] bg-[#111] rounded-sm p-8">
          <p className="text-[#e8e8e0] text-sm mb-6 leading-relaxed">
            Sign in to save, organize, and access your bookmarks from anywhere. Real-time sync across all your tabs.
          </p>

          <LoginButton />

          <div className="mt-6 flex items-center gap-3 text-[#333]">
            <div className="flex-1 h-px bg-[#1a1a1a]" />
            <span className="text-xs text-[#444]">secured by supabase</span>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: '⚡', label: 'Real-time sync' },
            { icon: '🔒', label: 'Private & secure' },
            { icon: '🌐', label: 'Any URL' },
          ].map((f) => (
            <div key={f.label} className="border border-[#1a1a1a] bg-[#0d0d0d] rounded-sm p-3">
              <div className="text-lg mb-1">{f.icon}</div>
              <div className="text-[10px] text-[#555] tracking-wider uppercase">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
