import { useEffect, useRef, useState } from 'react'
import { ChevronDown, KeyRound, LogOut, Settings, UserRound } from 'lucide-react'

export default function UserMenu({
  displayName,
  username,
  isAdmin = false,
  onLogout,
}: {
  displayName: string
  username?: string
  isAdmin?: boolean
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const closeMenu = () => setOpen(false)

  return (
    <div ref={rootRef} className="relative shrink-0" data-testid="user-menu">
      <button
        ref={triggerRef}
        type="button"
        aria-label="打开用户菜单"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className="group inline-flex max-w-[min(48vw,19rem)] items-center gap-2 rounded-xl border border-[#d9e3ea] bg-[#0f2146] px-2.5 py-1.5 text-left text-white shadow-sm transition hover:bg-[#172e5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78c6bc]"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0fa4a0] text-white">
          <UserRound size={17} strokeWidth={1.8} />
        </span>
        <span className="min-w-0 truncate text-sm font-medium">{displayName}</span>
        <span className="hidden shrink-0 items-center gap-1 rounded-md bg-[#effbdc] px-2 py-1 text-[11px] font-semibold text-[#55a32d] sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#55a32d]" aria-hidden="true" />
          后端正常
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={`shrink-0 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="用户菜单"
          className="absolute right-0 top-[calc(100%+10px)] z-[70] w-64 overflow-hidden rounded-2xl border border-[#e4e9ee] bg-white p-1.5 text-[#17202f] shadow-[0_18px_48px_rgba(15,33,70,.2)]"
        >
          <div className="flex items-center justify-between gap-3 px-3.5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#1b2430]">{displayName}</p>
              <p className="mt-0.5 text-xs text-[#8a939d]">{isAdmin ? '管理员' : '学生用户'}</p>
            </div>
            {username && <span className="shrink-0 rounded-md bg-[#edf5ff] px-2 py-1 text-xs font-medium text-[#2775d3]">{username}</span>}
          </div>
          <div className="mx-1 h-px bg-[#e8ebef]" role="separator" />
          {isAdmin && (
            <a
              role="menuitem"
              href="/admin/users"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#343b45] transition hover:bg-[#f4f7fa]"
            >
              <Settings size={16} className="text-[#66717c]" />
              用户管理
            </a>
          )}
          <a
            role="menuitem"
            href="/change-password"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#343b45] transition hover:bg-[#f4f7fa]"
          >
            <KeyRound size={16} className="text-[#66717c]" />
            修改密码
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu()
              onLogout()
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#343b45] transition hover:bg-[#f4f7fa]"
          >
            <LogOut size={16} className="text-[#66717c]" />
            退出登录并切换用户
          </button>
        </div>
      )}
    </div>
  )
}
