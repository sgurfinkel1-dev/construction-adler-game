// Lightweight sound effects using the Web Audio API — no asset files needed.
class AudioManager {
  constructor() {
    this.ctx = null
    this.enabled = true
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      this.ctx = new AC()
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
  }

  tone({ freq = 200, type = 'sine', duration = 0.1, volume = 0.2, sweep = 0 }) {
    if (!this.enabled) return
    this.ensure()
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), t + duration)
    gain.gain.setValueAtTime(volume, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(gain).connect(this.ctx.destination)
    osc.start(t)
    osc.stop(t + duration)
  }

  // Short gritty crunch for digging — frequency varies by material hardness.
  dig(material) {
    const map = { sand: 320, dirt: 200, rock: 90 }
    this.tone({ freq: map[material] || 200, type: 'square', duration: 0.07, volume: 0.12, sweep: -60 })
  }

  collect() {
    this.tone({ freq: 660, type: 'triangle', duration: 0.09, volume: 0.18, sweep: 220 })
  }

  levelUp() {
    ;[523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.tone({ freq: f, type: 'triangle', duration: 0.15, volume: 0.2 }), i * 90)
    )
  }

  // Harsh downward noise-ish thud for crashes.
  crash() {
    this.tone({ freq: 160, type: 'sawtooth', duration: 0.28, volume: 0.22, sweep: -110 })
    setTimeout(() => this.tone({ freq: 90, type: 'square', duration: 0.2, volume: 0.18, sweep: -50 }), 60)
  }

  // Rising whoosh for activating boost.
  boost() {
    this.tone({ freq: 280, type: 'sawtooth', duration: 0.3, volume: 0.16, sweep: 520 })
  }

  // Soft tick for a clean landing (feeds the combo).
  land() {
    this.tone({ freq: 440, type: 'triangle', duration: 0.06, volume: 0.12, sweep: 120 })
  }

  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }
}

export default new AudioManager()
