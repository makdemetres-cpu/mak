// Microphone, level metering and end-of-turn detection.
// Turn-taking is what makes this feel like a phone call rather than a form:
// you stop talking, he answers. No push-to-talk.

const SPEECH_START_MS = 140;   // sustained sound before we call it speech
const SILENCE_END_MS = 900;    // sustained quiet before your turn is over
const MIN_UTTERANCE_MS = 350;  // shorter than this is a cough, not a sentence
const SILENCE_TIMEOUT_MS = 9000; // you say nothing at all — he will prompt you

export class Mic {
  constructor() {
    this.stream = null;
    this.ctx = null;
    this.analyser = null;
    this.data = null;
    this.recorder = null;
    this.chunks = [];
    this.level = 0;
    this.noiseFloor = 0.012;
    this.running = false;
    this.mode = 'idle'; // idle | listening | monitoring
  }

  async open() {
    if (this.stream) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,   // stops MAKIS's own voice re-triggering the VAD
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.ctx = new (window.AudioContext ?? window.webkitAudioContext)();
    const source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.75;
    source.connect(this.analyser);
    this.data = new Float32Array(this.analyser.fftSize);
    this.running = true;
    this.#loop();
    await this.#calibrate();
  }

  /** Learn the room's background noise so the threshold is not a guess. */
  async #calibrate() {
    const samples = [];
    const started = performance.now();
    while (performance.now() - started < 400) {
      samples.push(this.#rms());
      await new Promise((r) => setTimeout(r, 25));
    }
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)] ?? 0.01;
    this.noiseFloor = Math.max(0.008, median * 1.6);
  }

  get threshold() {
    return Math.max(this.noiseFloor * 2.2, 0.022);
  }

  #rms() {
    if (!this.analyser) return 0;
    this.analyser.getFloatTimeDomainData(this.data);
    let sum = 0;
    for (let i = 0; i < this.data.length; i += 1) sum += this.data[i] * this.data[i];
    return Math.sqrt(sum / this.data.length);
  }

  #loop() {
    if (!this.running) return;
    this.level = this.#rms();
    requestAnimationFrame(() => this.#loop());
  }

  /**
   * Record one turn. Recording starts immediately (so the first word is never
   * clipped) and stops once you have been quiet for SILENCE_END_MS.
   */
  listen({ onSpeechStart, onEnd, onTimeout, record = true }) {
    this.mode = 'listening';
    this.chunks = [];
    let speaking = false;
    let speechSince = 0;
    let silenceSince = 0;
    let speechStartedAt = 0;
    const openedAt = performance.now();
    let stopped = false;

    if (record && window.MediaRecorder) {
      this.recorder = new MediaRecorder(this.stream, { mimeType: pickMime() });
      this.recorder.ondataavailable = (e) => { if (e.data.size) this.chunks.push(e.data); };
      this.recorder.start();
    }

    const finish = (reason) => {
      if (stopped) return;
      stopped = true;
      this.mode = 'idle';
      const durationMs = speechStartedAt ? performance.now() - speechStartedAt : 0;
      const done = (blob) => {
        if (reason === 'timeout') onTimeout?.();
        else onEnd?.(blob, durationMs);
      };
      if (this.recorder && this.recorder.state !== 'inactive') {
        this.recorder.onstop = () => done(new Blob(this.chunks, { type: this.recorder.mimeType }));
        this.recorder.stop();
      } else {
        done(null);
      }
    };

    const tick = () => {
      if (stopped || this.mode !== 'listening') return;
      const now = performance.now();
      const loud = this.level > this.threshold;

      if (loud) {
        silenceSince = 0;
        if (!speechSince) speechSince = now;
        if (!speaking && now - speechSince > SPEECH_START_MS) {
          speaking = true;
          speechStartedAt = now;
          onSpeechStart?.();
        }
      } else {
        speechSince = 0;
        if (!silenceSince) silenceSince = now;
        if (speaking && now - silenceSince > SILENCE_END_MS) {
          if (now - speechStartedAt > MIN_UTTERANCE_MS) return finish('speech');
          // Too short to be a turn — treat it as noise and keep listening.
          speaking = false;
          speechStartedAt = 0;
        }
        if (!speaking && now - openedAt > SILENCE_TIMEOUT_MS) return finish('timeout');
      }
      requestAnimationFrame(tick);
      return undefined;
    };

    requestAnimationFrame(tick);
    return () => finish('cancelled');
  }

  /** While MAKIS talks: watch for you cutting in. That is barge-in. */
  monitorForBargeIn(onBargeIn, sustainedMs = 260) {
    this.mode = 'monitoring';
    let since = 0;
    const tick = () => {
      if (this.mode !== 'monitoring') return;
      const now = performance.now();
      if (this.level > this.threshold * 1.5) {
        if (!since) since = now;
        if (now - since > sustainedMs) {
          this.mode = 'idle';
          onBargeIn();
          return;
        }
      } else {
        since = 0;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  stopMonitoring() {
    if (this.mode === 'monitoring') this.mode = 'idle';
  }

  close() {
    this.running = false;
    this.mode = 'idle';
    try { this.recorder?.state !== 'inactive' && this.recorder?.stop(); } catch { /* already stopped */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close();
    this.stream = null;
    this.ctx = null;
    this.analyser = null;
  }
}

function pickMime() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? '';
}
