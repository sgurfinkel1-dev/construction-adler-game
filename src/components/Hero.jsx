import { useEffect, useState } from 'react'

export default function Hero() {
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 100) {
        setHeroVisible(true)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header id="top" className="hero">
      <video
        className="hero-video"
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="hero-overlay" />

      <div className={`wrap hero-content ${heroVisible ? 'visible' : ''}`}>
        <p className="eyebrow">Adler Incorporadora</p>
        <h1>Realizando o sonho de <span className="accent">morar bem</span></h1>
        <p className="hero-lead">
          Qualidade, evolução e comprometimento em cada empreendimento — do terreno
          ao acabamento final, com a tranquilidade e a segurança que sua família merece.
        </p>
        <div className="hero-actions">
          <a href="#empreendimentos" className="btn btn-primary">Ver empreendimentos</a>
          <a href="#contato" className="btn btn-ghost">Fale conosco</a>
        </div>
      </div>

      <div className="scroll-cue">
        <span>Role</span>
        <span>↓</span>
      </div>
    </header>
  )
}
