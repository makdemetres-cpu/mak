// The orb: one ring that breathes with whoever currently holds the floor.
// Teal when it is listening to you, blue when MAKIS is talking, amber while thinking.

const PALETTE = {
  idle:      { core: '#2b3a45', glow: 'rgba(55,229,200,0.10)' },
  listening: { core: '#37e5c8', glow: 'rgba(55,229,200,0.34)' },
  speaking:  { core: '#6ba8ff', glow: 'rgba(107,168,255,0.34)' },
  thinking:  { core: '#f5c451', glow: 'rgba(245,196,81,0.28)' },
};

export class Orb {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'idle';
    this.level = 0;
    this.smooth = 0;
    this.phase = 0;
    this.history = new Array(72).fill(0);
    this.running = false;
    this.#resize();
    window.addEventListener('resize', () => this.#resize());
  }

  #resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = this.canvas.clientWidth || 320;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.size = size;
  }

  set(state, level = 0) {
    this.state = state;
    this.level = level;
  }

  start() {
    if (this.running) return;
    this.running = true;
    const frame = () => {
      if (!this.running) return;
      this.#draw();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  stop() { this.running = false; }

  #draw() {
    const { ctx, size } = this;
    const c = size / 2;
    const colors = PALETTE[this.state] ?? PALETTE.idle;

    // Ease towards the incoming level so the ring never jitters.
    this.smooth += (Math.min(1, this.level * 6) - this.smooth) * 0.18;
    this.phase += 0.012 + this.smooth * 0.05;
    this.history.push(this.smooth);
    this.history.shift();

    ctx.clearRect(0, 0, size, size);

    const base = size * 0.26;
    const swell = base * (1 + this.smooth * 0.28);

    // Outer glow
    const glow = ctx.createRadialGradient(c, c, swell * 0.5, c, c, swell * 2.1);
    glow.addColorStop(0, colors.glow);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    // Voice ring: a closed curve modulated by three harmonics, so it swells
    // and ripples with the speaker without ever showing a seam.
    ctx.beginPath();
    const steps = 160;
    for (let i = 0; i <= steps; i += 1) {
      const angle = (i / steps) * Math.PI * 2;
      const ripple =
        Math.sin(angle * 2 + this.phase * 1.7) * 0.55 +
        Math.sin(angle * 3 - this.phase * 1.1) * 0.30 +
        Math.sin(angle * 5 + this.phase * 2.3) * 0.15;
      const r = swell + ripple * this.smooth * size * 0.075 + Math.sin(this.phase) * size * 0.004;
      const x = c + Math.cos(angle) * r;
      const y = c + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = colors.core;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.9;
    ctx.stroke();

    // Recent history as a faint echo ring — the last couple of seconds of speech.
    ctx.beginPath();
    const points = this.history.length;
    for (let i = 0; i <= points; i += 1) {
      const angle = (i / points) * Math.PI * 2 - this.phase * 0.25;
      const r = swell * 1.34 + this.history[i % points] * size * 0.05;
      const x = c + Math.cos(angle) * r;
      const y = c + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner disc
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(c, c, base * 0.52, 0, Math.PI * 2);
    const disc = ctx.createRadialGradient(c, c - base * 0.2, 2, c, c, base * 0.7);
    disc.addColorStop(0, colors.core);
    disc.addColorStop(1, 'transparent');
    ctx.fillStyle = disc;
    ctx.globalAlpha = 0.28 + this.smooth * 0.5;
    ctx.fill();

    // Sweep hand — the console is always alive, even in silence
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(c, c, swell * 1.45, this.phase, this.phase + 0.5);
    ctx.strokeStyle = colors.core;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
