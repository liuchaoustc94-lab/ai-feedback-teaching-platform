import { useEffect, useState } from 'react'
import { Menu, X, ExternalLink } from 'lucide-react'
import type { ModuleKey } from '../lib/modules'
import UserMenu from '../components/UserMenu'

const navLinks = [
  { label: '信息加工', href: '#info-processing', moduleKey: 'information-processing' as ModuleKey },
  { label: '感觉系统', href: '#visual-test', moduleKey: 'sensory-proprioception' as ModuleKey },
  { label: '注意分配', href: '#attention', moduleKey: 'attention-allocation' as ModuleKey },
  { label: '动作协调', href: '#coordination', moduleKey: 'motor-coordination' as ModuleKey },
  { label: '数据导出', href: '#data-export', moduleKey: 'data-center' as ModuleKey },
]

export default function Navigation({
  visibleModules,
  isAdmin = false,
  userLabel,
  userName,
  onLogout,
}: {
  visibleModules?: readonly ModuleKey[]
  isAdmin?: boolean
  userLabel?: string
  userName?: string
  onLogout?: () => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const allowed = visibleModules ? new Set(visibleModules) : null
  const visibleLinks = allowed ? navLinks.filter((link) => allowed.has(link.moduleKey)) : navLinks

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
    setMenuOpen(false)
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="font-serif-cn text-lg tracking-wide text-[#111]">
          Motor Control Lab
        </a>

        <div className="flex items-center gap-3">
          {/* Desktop Links */}
          <div className="hidden items-center gap-8 md:flex">
            {visibleLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm text-[#333] transition-colors duration-300 hover:text-[#dc2f1b]"
              >
                {link.label}
              </a>
            ))}
            {allowed?.has('data-center') && <a href="/data-center" className="text-sm text-[#333] transition-colors duration-300 hover:text-[#dc2f1b]">数据中心</a>}
            {allowed?.has('training-archive') && <a href="/training-archive" className="text-sm text-[#333] transition-colors duration-300 hover:text-[#dc2f1b]">训练档案</a>}
            <a
              href="/platform.html"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#134A34] px-5 py-2 text-sm text-white transition-colors duration-300 hover:bg-[#0d3626]"
            >
              <ExternalLink size={13} />
              进入平台
            </a>
          </div>
          {userLabel && onLogout && (
            <UserMenu displayName={userLabel} username={userName} isAdmin={isAdmin} onLogout={onLogout} />
          )}
          {/* Mobile Menu Button */}
          <button
            className="p-2 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#e5e5e5] px-6 py-4 space-y-3">
          {visibleLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block text-sm text-[#333] py-2 hover:text-[#dc2f1b] transition-colors"
            >
              {link.label}
            </a>
          ))}
          {allowed?.has('data-center') && <a href="/data-center" className="block text-sm text-[#333] py-2 hover:text-[#dc2f1b] transition-colors">数据中心</a>}
          {allowed?.has('training-archive') && <a href="/training-archive" className="block text-sm text-[#333] py-2 hover:text-[#dc2f1b] transition-colors">训练档案</a>}
          <a
            href="/platform.html"
            className="inline-flex items-center gap-1.5 text-sm bg-[#134A34] text-white px-5 py-2 rounded-lg mt-2"
          >
            <ExternalLink size={13} />
            进入平台
          </a>
        </div>
      )}
    </nav>
  )
}
