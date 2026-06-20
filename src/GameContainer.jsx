import { useEffect, useRef, useState } from 'react'
import GameScene from './GameScene'
import audio from './audio'

function fmtTime(t) {
  const m = Math.floor(t / 60)
  const s = (t % 60).toFixed(1)
  return `${m}:${s.padStart(4, '0')}`
}

const MEDAL_EMOJI = { gold: '🥇', silver: '🥈', bronze: '🥉' }

export default function GameContainer({ onMenuClick }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [hud, setHud] = useState({
    scenario: '',
    scenarioIndex: 0,
    totalScenarios: 1,
    time: 0,
    speed: 0,
    progress: 0,
    finished: false,
    blocked: false,
    boost: 0,
    combo: 0,
    airborne: false,
    stunned: false,
    medal: null,
    bestTime: null,
    medals: { gold: 0, silver: 0, bronze: 0 },
  })
  const [soundOn, setSoundOn] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const game = new GameScene(canvas, { onUpdate: (snap) => setHud(snap) })
    gameRef.current = game

    const keyAction = (k) => {
      if (k === 'arrowright' || k === 'd') return 'accel'
      if (k === 'arrowleft' || k === 'a') return 'brake'
      if (k === ' ' || k === 'arrowup' || k === 'w') return 'dig'
      if (k === 'shift' || k === 'arrowdown' || k === 's') return 'boost'
      return null
    }
    const down = (e) => {
      const action = keyAction(e.key.toLowerCase())
      if (!action) return
      e.preventDefault()
      game.setKey(action, true)
      if (action === 'boost') audio.boost()
      if (action === 'dig' && !e.repeat) game.tapDig()
    }
    const up = (e) => {
      const action = keyAction(e.key.toLowerCase())
      if (!action) return
      game.setKey(action, false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      game.dispose()
    }
  }, [])

  const press = (action) => (e) => {
    e.preventDefault()
    gameRef.current?.setKey(action, true)
    if (action === 'boost') audio.boost()
    if (action === 'dig') gameRef.current?.tapDig()
  }
  const release = (action) => (e) => {
    e.preventDefault()
    gameRef.current?.setKey(action, false)
  }

  const toggleSound = () => setSoundOn(audio.toggle())
  const restart = () => gameRef.current?.restart()
  const nextRace = () => gameRef.current?.nextScenario()

  const isLast = hud.scenarioIndex >= hud.totalScenarios - 1
  const isBest = hud.finished && hud.bestTime != null && Math.abs(hud.time - hud.bestTime) < 0.05

  return (
    <div ref={wrapRef} className="game-wrap">
      <canvas ref={canvasRef} className="game-canvas" />

      <div className="hud">
        <div className="level">
          {hud.scenario} ({hud.scenarioIndex + 1}/{hud.totalScenarios})
        </div>
        <div className="progress">⏱ {fmtTime(hud.time)}</div>
        {hud.combo > 1 && <div className="combo-badge">🔥 x{hud.combo}</div>}
        <button onClick={toggleSound} className="menu-btn small">
          {soundOn ? '🔊' : '🔇'}
        </button>
        <button onClick={onMenuClick} className="menu-btn small">
          MENU
        </button>
      </div>

      {/* Race progress bar */}
      <div className="race-bar">
        <div className="race-fill" style={{ width: `${Math.round(hud.progress * 100)}%` }} />
        <div className="race-marker" style={{ left: `${Math.round(hud.progress * 100)}%` }}>
          🚜
        </div>
        <div className="race-flag">🏁</div>
      </div>

      {/* Boost meter */}
      <div className="boost-wrap">
        <span className="boost-label">BOOST</span>
        <div className="boost-bar">
          <div
            className={`boost-fill ${hud.boost >= 100 ? 'full' : ''}`}
            style={{ width: `${hud.boost}%` }}
          />
        </div>
      </div>

      {hud.blocked && !hud.finished && (
        <div className="dig-hint">⛏ Blocked! Tap DIG (Space / ↑) to clear it</div>
      )}
      {hud.airborne && !hud.finished && (
        <div className="air-hint">✈️ Lean! ▶ nose up · ◀ nose down — match the slope to land clean</div>
      )}

      {hud.finished && (
        <div className="winner-overlay">
          <div className="winner-panel">
            <h2>🏁 Finish!</h2>
            <p>{hud.scenario}</p>
            <p className="big-time">⏱ {fmtTime(hud.time)}</p>
            {hud.medal ? (
              <p className="medal-line">{MEDAL_EMOJI[hud.medal]} {hud.medal.toUpperCase()} MEDAL</p>
            ) : (
              <p className="medal-line dim">No medal — beat {hud.medals.bronze}s for 🥉</p>
            )}
            {isBest && <p className="best-line">⭐ New best time!</p>}
            {!isBest && hud.bestTime != null && (
              <p className="best-line dim">Best: {fmtTime(hud.bestTime)}</p>
            )}
            <div className="btn-row">
              {!isLast ? (
                <button onClick={nextRace} className="start-btn">
                  Next Track →
                </button>
              ) : (
                <button onClick={onMenuClick} className="start-btn alt">
                  🏆 All Tracks Done!
                </button>
              )}
              <button onClick={restart} className="start-btn alt">
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Touch controls */}
      <div className="touchpad left">
        <button
          className="touch-btn"
          onPointerDown={press('brake')}
          onPointerUp={release('brake')}
          onPointerLeave={release('brake')}
          onPointerCancel={release('brake')}
        >
          ◀
        </button>
        <button
          className="touch-btn boost"
          onPointerDown={press('boost')}
          onPointerUp={release('boost')}
          onPointerLeave={release('boost')}
          onPointerCancel={release('boost')}
        >
          🔥
        </button>
      </div>
      <div className="touchpad right">
        <div className="touch-move">
          <button
            className="touch-btn dig"
            onPointerDown={press('dig')}
            onPointerUp={release('dig')}
            onPointerLeave={release('dig')}
            onPointerCancel={release('dig')}
          >
            ⛏
          </button>
          <button
            className="touch-btn"
            onPointerDown={press('accel')}
            onPointerUp={release('accel')}
            onPointerLeave={release('accel')}
            onPointerCancel={release('accel')}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  )
}
