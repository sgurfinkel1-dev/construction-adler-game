import { useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import Game from '../game/Game'

/* ---------------- Values ---------------- */
const VALUES = [
  { ico: '◆', title: 'Qualidade', text: 'Priorizamos a qualidade desde a escolha do terreno até o acabamento final do imóvel, visando a satisfação dos nossos clientes.' },
  { ico: '↗', title: 'Evolução', text: 'Processos de melhoria contínua em técnicas construtivas e no desenvolvimento do nosso capital humano.' },
  { ico: '✓', title: 'Comprometimento', text: 'Comprometidos com o resultado final, com o cumprimento de prazos e das metas estabelecidas.' },
]

export function Values() {
  const [valuesRef] = useAutoAnimate()
  return (
    <section id="empresa" className="section alt">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Nosso objetivo</p>
          <h2>Melhorar a sua qualidade de vida</h2>
          <p>Realizamos o seu sonho de morar com tranquilidade, segurança e felicidade.</p>
        </div>
        <div className="values-grid" ref={valuesRef}>
          {VALUES.map((v) => (
            <div key={v.title} className="value-card">
              <div className="ico">{v.ico}</div>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- Empreendimentos ---------------- */
const EMP = [
  { name: 'Califórnia Residencial', city: 'Condomínio residencial', img: 'https://www.adlerincorporadora.com.br/wp-content/uploads/2018/02/Adler-Incorporadora_California-Residencial-768x512.png' },
  { name: 'Flórida Residencial', city: 'Condomínio residencial', img: 'https://www.adlerincorporadora.com.br/wp-content/uploads/2022/02/Adler_Empreendimentos_Florida-Residencial-768x512.jpg' },
  { name: 'Reserva Ilhas Açores', city: 'Eco condomínio', img: 'https://www.adlerincorporadora.com.br/wp-content/uploads/2022/02/Adler_Empreendimentos_Ilha-Acores-768x512.jpg' },
  { name: 'Reserva Munique Eco Club', city: 'Eco club', img: 'https://www.adlerincorporadora.com.br/wp-content/uploads/2022/02/Adler-Empreendimentos_Munique-768x512.jpg' },
  { name: 'Condomínio Green Life', city: 'Vida ao ar livre', img: 'https://www.adlerincorporadora.com.br/wp-content/uploads/2024/02/Adler.jpg' },
  { name: 'Residencial Maranello', city: 'Condomínio residencial', img: 'https://www.adlerincorporadora.com.br/wp-content/uploads/2025/04/Adler-Residencial-Maranello_previa-maranello-1-768x513.jpg' },
  { name: 'Reserva Algarve Eco Club', city: 'Eco club', img: 'https://www.adlerincorporadora.com.br/wp-content/uploads/2022/02/Adler-Empreendimentos_Algarve-768x513.jpg', soon: true },
]

export function Empreendimentos() {
  const [empRef] = useAutoAnimate()
  return (
    <section id="empreendimentos" className="section">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Conheça todos os nossos</p>
          <h2>Empreendimentos</h2>
          <p>Projetos pensados para quem busca conforto, segurança e contato com a natureza.</p>
        </div>
        <div className="emp-grid" ref={empRef}>
          {EMP.map((e) => (
            <div key={e.name} className="emp-card">
              <img src={e.img} alt={e.name} className="emp-bg" />
              {e.soon && <span className="emp-badge">Em breve</span>}
              <div className="emp-body">
                <h3>{e.name}</h3>
                <span>{e.city}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- História (second video) ---------------- */
export function Historia() {
  return (
    <section id="historia" className="section alt">
      <div className="wrap historia-grid">
        <div>
          <video
            className="historia-video"
            src="/historia.mp4"
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
          />
        </div>
        <div className="historia-text">
          <p className="eyebrow">Nossa história</p>
          <h2>Construindo confiança, entrega após entrega</h2>
          <p>
            A Adler Incorporadora nasceu do compromisso de transformar terrenos em
            lares — unindo técnica construtiva, planejamento e cuidado com cada
            detalhe. Ao longo dos anos, evoluímos em processos e pessoas para
            entregar empreendimentos que valorizam quem mora e a região onde estão.
          </p>
          <p>
            Cada projeto carrega a mesma promessa: qualidade do terreno ao
            acabamento, prazos cumpridos e a tranquilidade de morar bem.
          </p>
          <div className="historia-stats">
            <div className="stat"><strong>7+</strong><span>Empreendimentos</span></div>
            <div className="stat"><strong>100%</strong><span>Foco em qualidade</span></div>
            <div className="stat"><strong>∞</strong><span>Compromisso</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Game ---------------- */
export function GameSection() {
  return (
    <section id="jogo" className="section game-section">
      <div className="wrap">
        <div className="section-head">
          <p className="eyebrow">Enquanto você decide</p>
          <h2>Excavator Rally</h2>
          <p>Um joguinho da casa: pilote a escavadeira por terrenos variados, salte nas rampas e bata o tempo da medalha. 🏗️</p>
        </div>
        <div>
          <div className="game-frame">
            <Game />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Contato ---------------- */
export function Contato() {
  const [sent, setSent] = useState(false)
  return (
    <section id="contato" className="section navy">
      <div className="wrap contato-grid">
        <div className="contato-info">
          <p className="eyebrow">Contato</p>
          <h2>Vamos realizar o seu sonho</h2>
          <p>Entre em contato para conhecer nossos empreendimentos e tirar suas dúvidas. Nossa equipe está pronta para ajudar.</p>
          <div className="contact-item"><span className="ico">📞</span> 11 97679-1667</div>
          <div className="contact-item"><span className="ico">✉️</span> contato@adlerincorporadora.com.br</div>
          <div className="contact-item"><span className="ico">📍</span> São Paulo · SP</div>
        </div>
        <div>
          <form
            className="contato-form"
            onSubmit={(e) => { e.preventDefault(); setSent(true) }}
          >
            <input type="text" placeholder="Seu nome" required aria-label="Seu nome" />
            <input type="email" placeholder="Seu email" required aria-label="Seu email" />
            <input type="tel" placeholder="DDD + Seu telefone" aria-label="Seu telefone" />
            <textarea placeholder="Escreva sua mensagem" aria-label="Sua mensagem" />
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
              {sent ? '✓ Mensagem enviada!' : 'Enviar'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

/* ---------------- Footer ---------------- */
export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="socials">
          <a href="#" aria-label="Facebook">f</a>
          <a href="#" aria-label="Instagram">◎</a>
          <a href="#" aria-label="LinkedIn">in</a>
        </div>
        <p>© 2026 Adler Incorporadora — Realizando o sonho de morar bem.</p>
      </div>
    </footer>
  )
}
