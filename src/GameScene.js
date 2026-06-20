// Side-scrolling excavator RACING game with hilly terrain, jumps, crash physics,
// a boost economy and medal times. Read the terrain, nail your landings, manage
// boost, beat the medal.
import audio from './audio'

const SCENARIOS = [
  {
    name: 'Desert Dash',
    sky: ['#fde9b8', '#f6c177'],
    ground: '#d9a441',
    groundDark: '#b9842f',
    obstacle: '#c98a2e',
    obstacleHp: 1,
    length: 4600,
    friction: 2.0,
    hilliness: 1.0,
    medals: { gold: 18, silver: 24, bronze: 32 },
  },
  {
    name: 'Rocky Pass',
    sky: ['#9fb4c7', '#6d8299'],
    ground: '#6b6f73',
    groundDark: '#4c5052',
    obstacle: '#7f8c8d',
    obstacleHp: 3,
    length: 5400,
    friction: 2.4,
    hilliness: 1.5,
    medals: { gold: 26, silver: 34, bronze: 44 },
  },
  {
    name: 'Frozen Trail',
    sky: ['#dff3ff', '#a9d6f0'],
    ground: '#e8f4f8',
    groundDark: '#bcd9e4',
    obstacle: '#b9e3f0',
    obstacleHp: 2,
    length: 6000,
    friction: 0.9, // slippery
    hilliness: 1.3,
    medals: { gold: 28, silver: 36, bronze: 48 },
  },
  {
    name: 'Canyon Run',
    sky: ['#f3c1a0', '#c66b4a'],
    ground: '#a0522d',
    groundDark: '#7c3e22',
    obstacle: '#8b4513',
    obstacleHp: 3,
    length: 7200,
    friction: 2.2,
    hilliness: 1.8,
    medals: { gold: 34, silver: 46, bronze: 60 },
  },
]

const GROUND_FRAC = 0.7 // baseline ground level as fraction of canvas height
const EX_SCREEN_FRAC = 0.3
const HSTEP = 6 // terrain sample resolution (px)
const GRAVITY = 1500
const AIR_ROT = 2.4 // rad/sec air rotation from accel/brake
const CRASH_TOL = 0.55 // rad landing-angle mismatch that crashes you
const SAMP = 8 // px ahead used to measure slope

class GameScene {
  constructor(canvas, { onUpdate = () => {}, scenarioIndex = 0 } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.onUpdate = onUpdate

    this.particles = []
    this.hudTimer = 0
    this.input = { accel: false, brake: false, dig: false, boost: false }
    this.shake = 0

    this.resize()
    this._resizeHandler = () => this.resize()
    window.addEventListener('resize', this._resizeHandler)

    this.loadScenario(scenarioIndex)

    this.running = true
    this.lastTime = performance.now()
    this.loop = this.loop.bind(this)
    this._visHandler = () => {
      if (document.visibilityState === 'visible') this.lastTime = performance.now()
    }
    document.addEventListener('visibilitychange', this._visHandler)

    this.render()
    this.onUpdate(this.snapshot())
    requestAnimationFrame(this.loop)
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect()
    this.canvas.width = rect.width
    this.canvas.height = rect.height
    this.baseGroundY = Math.floor(this.canvas.height * GROUND_FRAC)
  }

  loadScenario(index) {
    this.scenarioIndex = ((index % SCENARIOS.length) + SCENARIOS.length) % SCENARIOS.length
    this.scenario = SCENARIOS[this.scenarioIndex]
    this.worldLength = this.scenario.length
    this.finished = false
    this.time = 0
    this.combo = 0
    this.maxCombo = 0
    this.boostMeter = 30
    this.stun = 0
    this.shake = 0
    this.popups = []

    this.buildTerrain()

    this.ex = {
      worldX: 60,
      ey: this.groundScreenY(60),
      vx: 0,
      vy: 0,
      maxSpeed: 540,
      accel: 660,
      angle: 0,
      onGround: true,
      armSwing: 0,
      digCooldown: 0,
      wheel: 0,
      boosting: false,
    }
    this.ex.angle = this.groundAngle(60)
    this.particles = []
    this.bestTime = this.loadBest()
  }

  buildTerrain() {
    const seed = this.scenarioIndex
    const n = Math.ceil(this.worldLength / HSTEP) + 2
    const amp = 26 * this.scenario.hilliness
    this.heights = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const x = i * HSTEP
      // Rolling layered hills.
      let h =
        Math.sin(x * 0.0042 + seed) * amp +
        Math.sin(x * 0.013 + seed * 2.3) * amp * 0.45 +
        Math.sin(x * 0.027 + seed * 5.1) * amp * 0.2
      this.heights[i] = h
    }
    // Flatten the start so you launch fairly.
    for (let i = 0; i < 30 && i < n; i++) this.heights[i] = 0

    // Place explicit jump ramps (launch lip + drop) and dig walls alternately.
    this.obstacles = []
    this.ramps = []
    const featureCount = 6 + this.scenarioIndex * 2
    const usable = this.worldLength - 900
    const gap = usable / featureCount
    for (let f = 0; f < featureCount; f++) {
      const fx = 600 + f * gap + (pseudo(f, seed) - 0.5) * gap * 0.4
      if (f % 2 === 0) {
        // Ramp: raise a triangle into a lip, then a small drop on the far side.
        const rampLen = 150 + pseudo(f, seed * 3) * 90
        const lift = 70 + pseudo(f, seed * 7) * 60
        this.addRamp(fx, rampLen, lift)
        this.ramps.push({ x: fx, len: rampLen })
      } else {
        // Dig wall sitting on the ground.
        const hp = this.scenario.obstacleHp
        this.obstacles.push({
          x: fx,
          width: 32 + Math.floor(pseudo(f, seed * 3) * 24),
          hp,
          maxHp: hp,
        })
      }
    }

    this.hills = []
    for (let i = 0; i < 26; i++) {
      this.hills.push({ x: i * 320 + pseudo(i, 7) * 120, r: 90 + pseudo(i, 13) * 130 })
    }
  }

  // Raise terrain into a launch ramp centred at world x cx.
  addRamp(cx, len, lift) {
    const start = cx - len / 2
    const i0 = Math.max(0, Math.floor(start / HSTEP))
    const steps = Math.floor(len / HSTEP)
    for (let k = 0; k <= steps; k++) {
      const i = i0 + k
      if (i >= this.heights.length) break
      const t = k / steps // 0..1 rising
      this.heights[i] += lift * t * t // accelerating rise → steep lip at the top
    }
    // Drop just after the lip so the crest launches you.
    const dropStart = i0 + steps + 1
    for (let k = 0; k < 8; k++) {
      const i = dropStart + k
      if (i >= this.heights.length) break
      this.heights[i] += lift * Math.max(0, 1 - k / 3) * 0.3
    }
  }

  heightOffset(worldX) {
    const fi = worldX / HSTEP
    const i = Math.floor(fi)
    if (i < 0) return this.heights[0]
    if (i >= this.heights.length - 1) return this.heights[this.heights.length - 1]
    const t = fi - i
    return this.heights[i] * (1 - t) + this.heights[i + 1] * t
  }

  groundScreenY(worldX) {
    return this.baseGroundY - this.heightOffset(worldX)
  }

  groundAngle(worldX) {
    const a = this.groundScreenY(worldX)
    const b = this.groundScreenY(worldX + SAMP)
    return Math.atan2(b - a, SAMP)
  }

  setKey(action, pressed) {
    if (action in this.input) this.input[action] = pressed
  }

  tapDig() {
    if (this.ex.digCooldown <= 0) this.digFront()
  }

  frontObstacle() {
    const nose = this.ex.worldX + 30
    for (const o of this.obstacles) {
      if (o.hp > 0 && nose >= o.x - 12 && this.ex.worldX < o.x + o.width) return o
    }
    return null
  }

  digFront() {
    const o = this.frontObstacle()
    if (!o) return
    o.hp -= 1
    this.ex.armSwing = 1
    this.ex.digCooldown = 0.14
    const px = o.x - this.cameraX()
    this.spawnParticles(px, this.groundScreenY(o.x) - 20, this.scenario.obstacle, 6)
    audio.dig(o.hp > 0 ? 'rock' : 'dirt')
    if (o.hp <= 0) {
      audio.collect()
      this.spawnParticles(px, this.groundScreenY(o.x) - 20, this.scenario.obstacle, 16)
      this.addBoost(18)
      this.combo += 1
      this.maxCombo = Math.max(this.maxCombo, this.combo)
      this.addPopup(`CLEARED! x${this.combo}`, px, this.groundScreenY(o.x) - 60, '#ffd700')
    }
  }

  addBoost(n) {
    this.boostMeter = Math.min(100, this.boostMeter + n)
  }

  addPopup(text, x, y, color) {
    this.popups.push({ text, x, y, color, life: 1.1 })
  }

  cameraX() {
    const target = this.ex.worldX - this.canvas.width * EX_SCREEN_FRAC
    return Math.max(0, Math.min(this.worldLength - this.canvas.width, target))
  }

  loop(now) {
    if (!this.running) return
    const dt = Math.min((now - this.lastTime) / 1000, 0.05)
    this.lastTime = now
    this.update(dt)
    this.render()
    requestAnimationFrame(this.loop)
  }

  update(dt) {
    const ex = this.ex
    if (!this.finished) this.time += dt
    if (this.stun > 0) this.stun -= dt
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 40)

    const stunned = this.stun > 0
    const wantAccel = this.input.accel && !stunned
    const wantBrake = this.input.brake && !stunned

    // Boost handling.
    ex.boosting = this.input.boost && this.boostMeter > 0 && !stunned
    if (ex.boosting) {
      this.boostMeter = Math.max(0, this.boostMeter - 38 * dt)
      this.spawnBoostFlame()
    }
    const boostFactor = ex.boosting ? 1.9 : 1
    const maxSpeed = ex.maxSpeed * (ex.boosting ? 1.45 : 1)

    // Horizontal accel / brake / friction.
    if (wantAccel) ex.vx += ex.accel * boostFactor * dt
    if (wantBrake) ex.vx -= ex.accel * 1.2 * dt
    if (!wantAccel && !wantBrake && !ex.boosting) {
      ex.vx -= Math.sign(ex.vx) * Math.min(Math.abs(ex.vx), this.scenario.friction * 55 * dt)
    }
    ex.vx = Math.max(-maxSpeed * 0.35, Math.min(maxSpeed, ex.vx))

    // Obstacle wall blocking (only matters while roughly grounded).
    const blocker = this.frontObstacle()
    if (blocker && ex.vx > 0 && ex.onGround) {
      ex.worldX = Math.min(ex.worldX, blocker.x - 30)
      ex.vx = 0
      ex.digCooldown -= dt
      if (this.input.dig && !stunned && ex.digCooldown <= 0) this.digFront()
    } else {
      ex.worldX += ex.vx * dt
      ex.digCooldown -= dt
      if (this.input.dig && !stunned && ex.digCooldown <= 0 && this.frontObstacle()) this.digFront()
    }
    ex.worldX = Math.max(0, ex.worldX)

    // Vertical: ground-following with launch + ballistic flight.
    const gy = this.groundScreenY(ex.worldX)
    if (ex.onGround) {
      const slope = (this.groundScreenY(ex.worldX + SAMP) - gy) / SAMP
      const followVy = ex.vx * slope
      const nextEy = ex.ey + followVy * dt
      const nextGy = this.groundScreenY(ex.worldX)
      if (nextEy < nextGy - 3 && ex.vx > 120) {
        // Crest of a ramp: launch.
        ex.onGround = false
        ex.vy = followVy
      } else {
        ex.ey = nextGy
        ex.vy = 0
        ex.angle = this.groundAngle(ex.worldX)
      }
    }
    if (!ex.onGround) {
      ex.vy += GRAVITY * dt
      ex.ey += ex.vy * dt
      // Air control — lean for your landing.
      if (wantAccel) ex.angle -= AIR_ROT * dt // nose up
      if (wantBrake) ex.angle += AIR_ROT * dt // nose down
      const landGy = this.groundScreenY(ex.worldX)
      if (ex.ey >= landGy) {
        const gAngle = this.groundAngle(ex.worldX)
        const diff = Math.abs(normAngle(ex.angle - gAngle))
        if (diff > CRASH_TOL && ex.vy > 160) {
          this.crash()
        } else {
          // Clean landing → reward.
          if (ex.vy > 220) {
            this.addBoost(14)
            this.combo += 1
            this.maxCombo = Math.max(this.maxCombo, this.combo)
            this.addPopup(`CLEAN LAND! x${this.combo}`, this.canvas.width * EX_SCREEN_FRAC, landGy - 70, '#2ecc71')
            audio.land()
            this.shake = Math.min(8, this.shake + 4)
          }
          ex.ey = landGy
          ex.vy = 0
          ex.onGround = true
          ex.angle = gAngle
        }
      }
    }

    ex.wheel += ex.vx * dt * 0.05
    ex.armSwing = Math.max(0, ex.armSwing - dt * 4)

    // Finish.
    if (!this.finished && ex.worldX >= this.worldLength - 120) {
      this.finished = true
      this.running = false
      this.saveBest()
      audio.levelUp()
    }

    // Particles & popups.
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.vy += 900 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
      if (p.life <= 0) this.particles.splice(i, 1)
    }
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pp = this.popups[i]
      pp.y -= 30 * dt
      pp.life -= dt
      if (pp.life <= 0) this.popups.splice(i, 1)
    }

    this.hudTimer += dt
    if (this.hudTimer >= 0.08 || this.finished) {
      this.hudTimer = 0
      this.onUpdate(this.snapshot())
    }
  }

  crash() {
    const ex = this.ex
    ex.vx *= 0.15
    ex.vy = 0
    ex.onGround = true
    ex.ey = this.groundScreenY(ex.worldX)
    ex.angle = this.groundAngle(ex.worldX)
    this.stun = 0.8
    this.shake = 16
    this.combo = 0
    audio.crash()
    this.spawnParticles(this.canvas.width * EX_SCREEN_FRAC, ex.ey - 20, '#888', 22)
    this.addPopup('CRASH!', this.canvas.width * EX_SCREEN_FRAC, ex.ey - 70, '#e74c3c')
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 240,
        vy: -Math.random() * 280 - 40,
        life: 0.5 + Math.random() * 0.4,
        size: 2 + Math.random() * 4,
        color,
      })
    }
  }

  spawnBoostFlame() {
    const sx = this.ex.worldX - this.cameraX()
    this.particles.push({
      x: sx - 24,
      y: this.ex.ey - 16,
      vx: -160 - Math.random() * 120,
      vy: (Math.random() - 0.5) * 60,
      life: 0.25 + Math.random() * 0.2,
      size: 3 + Math.random() * 4,
      color: Math.random() > 0.5 ? '#ff8c00' : '#ffd700',
    })
  }

  render() {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height
    const cam = this.cameraX()
    const s = this.scenario

    let shx = 0
    let shy = 0
    if (this.shake > 0) {
      shx = (Math.random() - 0.5) * this.shake
      shy = (Math.random() - 0.5) * this.shake
    }
    ctx.save()
    ctx.translate(shx, shy)

    // Sky.
    const sky = ctx.createLinearGradient(0, 0, 0, this.baseGroundY)
    sky.addColorStop(0, s.sky[0])
    sky.addColorStop(1, s.sky[1])
    ctx.fillStyle = sky
    ctx.fillRect(-20, -20, w + 40, this.baseGroundY + 40)

    // Sun.
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.beginPath()
    ctx.arc(w - 80, 70, 32, 0, Math.PI * 2)
    ctx.fill()

    // Parallax hills.
    ctx.fillStyle = 'rgba(255,255,255,0.16)'
    for (const hill of this.hills) {
      const hx = hill.x - cam * 0.4
      if (hx + hill.r < 0 || hx - hill.r > w) continue
      ctx.beginPath()
      ctx.arc(hx, this.baseGroundY, hill.r, Math.PI, 0)
      ctx.fill()
    }

    // Terrain — draw the elevation profile as a filled polygon.
    ctx.fillStyle = s.ground
    ctx.beginPath()
    ctx.moveTo(-20, h + 20)
    for (let sx = -20; sx <= w + 20; sx += HSTEP) {
      ctx.lineTo(sx, this.groundScreenY(sx + cam))
    }
    ctx.lineTo(w + 20, h + 20)
    ctx.closePath()
    ctx.fill()
    // Surface line.
    ctx.strokeStyle = s.groundDark
    ctx.lineWidth = 5
    ctx.beginPath()
    for (let sx = -20; sx <= w + 20; sx += HSTEP) {
      const y = this.groundScreenY(sx + cam)
      if (sx === -20) ctx.moveTo(sx, y)
      else ctx.lineTo(sx, y)
    }
    ctx.stroke()

    // Ramp highlight chevrons.
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    for (const r of this.ramps) {
      const rx = r.x - cam
      if (rx < -100 || rx > w + 100) continue
      const ry = this.groundScreenY(r.x)
      ctx.beginPath()
      ctx.moveTo(rx - 8, ry - 4)
      ctx.lineTo(rx + 6, ry - 14)
      ctx.lineTo(rx + 6, ry - 4)
      ctx.closePath()
      ctx.fill()
    }

    // Obstacles.
    for (const o of this.obstacles) {
      if (o.hp <= 0) continue
      const ox = o.x - cam
      if (ox + o.width < 0 || ox > w) continue
      const baseY = this.groundScreenY(o.x)
      const hgt = 30 + o.maxHp * 14
      ctx.fillStyle = s.obstacle
      ctx.beginPath()
      ctx.moveTo(ox - o.width / 2, baseY)
      ctx.quadraticCurveTo(ox, baseY - hgt, ox + o.width / 2, baseY)
      ctx.closePath()
      ctx.fill()
      if (o.hp < o.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.22)'
        ctx.beginPath()
        ctx.moveTo(ox - o.width / 2, baseY)
        ctx.quadraticCurveTo(ox, baseY - hgt * (o.hp / o.maxHp), ox + o.width / 2, baseY)
        ctx.closePath()
        ctx.fill()
      }
    }

    // Finish line.
    const fx = this.worldLength - 120 - cam
    if (fx < w + 40 && fx > -40) {
      const fbY = this.groundScreenY(this.worldLength - 120)
      const sq = 13
      for (let row = 0; row < 6; row++) {
        for (let xx = 0; xx < 2; xx++) {
          const dark = (row + xx) % 2 === 0
          ctx.fillStyle = dark ? '#111' : '#fff'
          ctx.fillRect(fx + xx * sq, fbY - (row + 1) * sq, sq, sq)
        }
      }
      ctx.fillStyle = '#111'
      ctx.fillRect(fx - 4, fbY - sq * 6, 4, sq * 6)
    }

    // Speed lines when fast or boosting.
    const speedFrac = Math.abs(this.ex.vx) / this.ex.maxSpeed
    if (speedFrac > 0.7 || this.ex.boosting) {
      ctx.strokeStyle = `rgba(255,255,255,${this.ex.boosting ? 0.4 : 0.2})`
      ctx.lineWidth = 2
      for (let i = 0; i < 8; i++) {
        const ly = 40 + ((i * 97 + (this.ex.wheel * 40) % 400) % (h - 120))
        const lx = (i * 211 + this.ex.wheel * 60) % w
        ctx.beginPath()
        ctx.moveTo(lx, ly)
        ctx.lineTo(lx - 40, ly)
        ctx.stroke()
      }
    }

    // Excavator (rotated to body angle).
    this.drawExcavator(ctx, this.ex.worldX - cam, this.ex.ey, this.ex.angle)

    // Particles.
    this.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.fillStyle = p.color
      ctx.fillRect(p.x, p.y, p.size, p.size)
    })
    ctx.globalAlpha = 1

    // Floating popups (combo / crash text).
    ctx.textAlign = 'center'
    ctx.font = 'bold 22px sans-serif'
    this.popups.forEach((pp) => {
      ctx.globalAlpha = Math.max(0, Math.min(1, pp.life))
      ctx.fillStyle = pp.color
      ctx.fillText(pp.text, pp.x, pp.y)
    })
    ctx.globalAlpha = 1

    ctx.restore()
  }

  drawExcavator(ctx, x, baseY, angle) {
    const swing = this.ex.armSwing
    ctx.save()
    ctx.translate(x, baseY - 6)
    ctx.rotate(angle)

    ctx.fillStyle = '#2c3e50'
    ctx.fillRect(-26, -16, 52, 16)
    ctx.fillStyle = '#1a252f'
    const off = (this.ex.wheel % 8 + 8) % 8
    for (let i = -24; i < 24; i += 8) ctx.fillRect(i + off - 4, -13, 4, 11)

    ctx.fillStyle = this.stun > 0 ? '#e74c3c' : '#ff8c00'
    ctx.fillRect(-20, -38, 34, 24)
    ctx.fillStyle = '#222'
    ctx.fillRect(-2, -36, 16, 16)
    ctx.fillStyle = '#aee0ff'
    ctx.fillRect(1, -33, 10, 8)

    ctx.strokeStyle = this.stun > 0 ? '#e74c3c' : '#ff8c00'
    ctx.lineWidth = 7
    ctx.lineCap = 'round'
    const ax = 12
    const ay = -28
    const bx = 34 + swing * 8
    const by = -10 + swing * 20
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()
    ctx.fillStyle = '#555'
    ctx.beginPath()
    ctx.moveTo(bx - 6, by)
    ctx.lineTo(bx + 10, by - 2)
    ctx.lineTo(bx + 8, by + 14)
    ctx.lineTo(bx - 4, by + 12)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  medalFor(time) {
    const m = this.scenario.medals
    if (time <= m.gold) return 'gold'
    if (time <= m.silver) return 'silver'
    if (time <= m.bronze) return 'bronze'
    return null
  }

  bestKey() {
    return `excavator-rally-best-${this.scenario.name}`
  }
  loadBest() {
    try {
      const v = localStorage.getItem(this.bestKey())
      return v ? parseFloat(v) : null
    } catch {
      return null
    }
  }
  saveBest() {
    try {
      if (this.bestTime == null || this.time < this.bestTime) {
        this.bestTime = this.time
        localStorage.setItem(this.bestKey(), String(this.time))
      }
    } catch {
      /* ignore */
    }
  }

  snapshot() {
    const progress = Math.min(1, this.ex.worldX / (this.worldLength - 120))
    return {
      scenario: this.scenario.name,
      scenarioIndex: this.scenarioIndex,
      totalScenarios: SCENARIOS.length,
      time: this.time,
      speed: Math.max(0, Math.round((this.ex.vx / this.ex.maxSpeed) * 100)),
      progress,
      finished: this.finished,
      blocked: !!this.frontObstacle() && this.ex.onGround,
      boost: Math.round(this.boostMeter),
      combo: this.combo,
      airborne: !this.ex.onGround,
      stunned: this.stun > 0,
      medal: this.finished ? this.medalFor(this.time) : null,
      bestTime: this.bestTime,
      medals: this.scenario.medals,
    }
  }

  restart() {
    this.loadScenario(this.scenarioIndex)
    this.running = true
    this.lastTime = performance.now()
    requestAnimationFrame(this.loop)
  }

  nextScenario() {
    this.loadScenario(this.scenarioIndex + 1)
    this.running = true
    this.lastTime = performance.now()
    requestAnimationFrame(this.loop)
  }

  dispose() {
    this.running = false
    window.removeEventListener('resize', this._resizeHandler)
    document.removeEventListener('visibilitychange', this._visHandler)
  }
}

export const SCENARIO_LIST = SCENARIOS.map((s) => s.name)

function pseudo(a, b) {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
  return v - Math.floor(v)
}

// Normalize an angle to [-PI, PI].
function normAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

export default GameScene
