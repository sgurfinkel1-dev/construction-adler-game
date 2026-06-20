import { useState } from 'react'
import GameContainer from '../GameContainer'

// Embeddable Excavator Rally — start menu + the running game, sized to fill
// whatever container it's placed in (see .game-frame / .game-stage in site.css).
export default function Game() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="game-stage">
      {!playing ? (
        <div className="game-menu">
          <h3>🚜 Excavator Rally</h3>
          <p>Construction Adler</p>
          <button className="btn btn-primary" onClick={() => setPlaying(true)}>
            ▶ START RACE
          </button>
          <div className="game-info">
            <p>▶ / D acelera · ◀ / A freia · ⛏ Espaço / ↑ escava · 🔥 Shift / ↓ turbo</p>
            <p>Salte nas rampas e incline-se para pousar limpo — ganhe turbo e bata o tempo da medalha 🥇</p>
          </div>
        </div>
      ) : (
        <GameContainer onMenuClick={() => setPlaying(false)} />
      )}
    </div>
  )
}
