import { useEffect, useState } from 'react'
import { Menu, X, ExternalLink } from 'lucide-react'

const navLinks = [
  { label: '信息加工', href: '#info-processing' },
  { label: '感觉系统', href: '#visual-test' },
  { label: '注意分配', href: '#attention' },
  { label: '动作协调', href: '#coordination' },
  { label: '数据导出', href: '#data-export' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-sm text-[#333] hover:text-[#dc2f1b] transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/platform.html"
            className="inline-flex items-center gap-1.5 text-sm bg-[#134A34] text-white px-5 py-2 rounded-lg hover:bg-[#0d3626] transition-colors duration-300"
          >
            <ExternalLink size={13} />
            进入平台
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#e5e5e5] px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block text-sm text-[#333] py-2 hover:text-[#dc2f1b] transition-colors"
            >
              {link.label}
            </a>
          ))}
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
