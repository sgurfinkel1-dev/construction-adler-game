import { useEffect, useState } from 'react'

const LINKS = [
  ['Empreendimentos', '#empreendimentos'],
  ['História', '#historia'],
  ['Jogo', '#jogo'],
  ['Empresa', '#empresa'],
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <a href="#top" className="nav-brand">
        <img src="/logo.png" alt="Adler Incorporadora" className="nav-logo" />
      </a>
      <button
        className="nav-toggle"
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? '✕' : '☰'}
      </button>
      <div className={`nav-links ${open ? 'open' : ''}`}>
        {LINKS.map(([label, href]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
        <a href="#contato" className="nav-cta" onClick={() => setOpen(false)}>
          Contato
        </a>
      </div>
    </nav>
  )
}
