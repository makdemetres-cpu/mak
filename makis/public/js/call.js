// One live call: pick up, listen, answer, hang up.

import { Mic } from './vad.js';

/** Plays MAKIS's voice — server audio when there is a real TTS key, the
 *  browser's own voice when there is not — and reports its level to the orb. */
class Speaker {
  constructor() {
    this.ctx = new (window.AudioContext ?? window.webkitAudioContext)();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.connect(this.ctx.destination);
    this.data = new Float32Array(this.analyser.fftSize);
    this.queue = [];
    this.playing = false;
    this.source = null;
    this.stopped = false;
    this.fakeLevel = 0;
  }

  get level() {
    if (this.fakeLevel) return this.fakeLevel;
    this.analyser.getFloatTimeDomainData(this.data);
    let sum = 0;
    for (let i = 0; i < this.data.length; i += 1) sum += this.data[i] * this.data[i];
    return Math.sqrt(sum / this.data.length);
  }

  async enqueueAudio(base64) {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const buffer = await this.ctx.decodeAudioData(bytes.buffer);
    this.queue.push({ type: 'buffer', buffer });
    this.#pump();
  }

  enqueueSpeech(text) {
    this.queue.push({ type: 'speech', text });
    this.#pump();
  }

  async #pump() {
    if (this.playing || this.stopped) return;
    const item = this.queue.shift();
    if (!item) return;
    this.playing = true;
    try {
      if (item.type === 'buffer') await this.#playBuffer(item.buffer);
      else await this.#speak(item.text);
    } catch { /* a failed chunk must not kill the call */ }
    this.playing = false;
    if (!this.stopped) this.#pump();
  }

  #playBuffer(buffer) {
    return new Promise((resolve) => {
      if (this.stopped) return resolve();
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.analyser);
      source.onended = () => { this.source = null; resolve(); };
      this.source = source;
      source.start();
      return undefined;
    });
  }

  #speak(text) {
    return new Promise((resolve) => {
      if (this.stopped || !window.speechSynthesis) return resolve();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'el-GR';
      utter.rate = 1.02;
      const greek = speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('el'));
      if (greek) utter.voice = greek;
      // No waveform to read from the synth, so drive the orb with a plausible one.
      const wobble = setInterval(() => { this.fakeLevel = 0.05 + Math.random() * 0.09; }, 90);
      const done = () => { clearInterval(wobble); this.fakeLevel = 0; resolve(); };
      utter.onend = done;
      utter.onerror = done;
      speechSynthesis.speak(utter);
      return undefined;
    });
  }

  get busy() { return this.playing || this.queue.length > 0; }

  stop() {
    this.stopped = true;
    this.queue = [];
    try { this.source?.stop(); } catch { /* not started */ }
    window.speechSynthesis?.cancel();
    this.fakeLevel = 0;
    this.playing = false;
    setTimeout(() => { this.stopped = false; }, 60);
  }

  close() {
    this.stop();
    this.ctx.close();
  }
}

export class Call {
  constructor(ui) {
    this.ui = ui;
    this.mic = new Mic();
    this.speaker = new Speaker();
    this.sessionId = null;
    this.over = false;
    this.recognition = null;
  }

  get level() {
    if (this.speaker.busy) return this.speaker.level;
    return this.mic.level;
  }

  async start({ difficulty, scenario, browserSpeech }) {
    this.browserSpeech = browserSpeech;
    await this.mic.open();

    const res = await fetch('/api/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty, scenario }),
    });
    if (!res.ok) throw new Error('Δεν ήταν δυνατή η έναρξη της κλήσης.');
    const call = await res.json();

    this.sessionId = call.sessionId;
    this.ui.onCallStarted?.(call);
    this.ui.onLine?.({ speaker: 'makis', text: call.pickup.text });

    this.ui.onStatus?.('speaking', 'Σήκωσε το τηλέφωνο');
    if (call.pickup.audio) await this.speaker.enqueueAudio(call.pickup.audio);
    else this.speaker.enqueueSpeech(call.pickup.text);
    await this.#waitForSpeaker();

    this.#listen();
    return call;
  }

  #listen() {
    if (this.over) return;
    this.ui.onStatus?.('listening', 'Μιλήστε — σταματάει μόνο του όταν σωπάσετε');

    if (this.browserSpeech) return this.#listenWithBrowserSTT();

    this.cancelListen = this.mic.listen({
      onSpeechStart: () => this.ui.onStatus?.('listening', 'Σας ακούει…'),
      onEnd: (blob, durationMs) => this.#sendAudio(blob, durationMs),
      onTimeout: () => this.#sendText('(σιωπή — ο πωλητής δεν μιλάει)', 0),
    });
    return undefined;
  }

  /** Chrome/Edge only: recognition happens on the device, no audio uploaded. */
  #listenWithBrowserSTT() {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      this.ui.onError?.('Ο browser δεν υποστηρίζει αναγνώριση φωνής. Χρησιμοποίησε Chrome ή βάλε κλειδί Groq.');
      return;
    }
    const recognition = new Recognition();
    this.recognition = recognition;
    recognition.lang = 'el-GR';
    recognition.interimResults = true;
    recognition.continuous = false;

    let finalText = '';
    const startedAt = performance.now();
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (interim) this.ui.onInterim?.(interim);
    };
    recognition.onerror = () => { /* handled by onend */ };
    recognition.onend = () => {
      this.recognition = null;
      if (this.over) return;
      const text = finalText.trim();
      if (text) this.#sendText(text, performance.now() - startedAt);
      else this.#listen();
    };
    recognition.start();
  }

  async #sendAudio(blob, durationMs) {
    if (!blob || blob.size < 1200) return this.#listen();
    return this.#send(
      await blob.arrayBuffer(),
      blob.type || 'audio/webm',
      durationMs
    );
  }

  #sendText(text, durationMs) {
    return this.#send(JSON.stringify({ text, durationMs }), 'application/json', durationMs);
  }

  async #send(body, contentType, durationMs) {
    if (this.over) return;
    this.ui.onStatus?.('thinking', 'Σκέφτεται…');

    let res;
    try {
      res = await fetch(`/api/call/${this.sessionId}/turn?duration=${Math.round(durationMs)}`, {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body,
      });
    } catch {
      this.ui.onError?.('Χάθηκε η σύνδεση με τον διακομιστή.');
      return;
    }
    if (!res.ok || !res.body) {
      this.ui.onError?.('Ο διακομιστής δεν απάντησε.');
      return;
    }

    let hungUp = false;
    let spoke = false;

    await readEvents(res.body, async (event, data) => {
      switch (event) {
        case 'transcript':
          this.ui.onLine?.({ speaker: 'user', text: data.text });
          break;
        case 'reply':
          this.ui.onLine?.({ speaker: 'makis', text: data.text });
          this.ui.onStatus?.('speaking', '');
          break;
        case 'state':
          this.ui.onState?.(data);
          break;
        case 'audio':
          spoke = true;
          await this.speaker.enqueueAudio(data.data);
          this.#armBargeIn();
          break;
        case 'speak':
          spoke = true;
          this.speaker.enqueueSpeech(data.text);
          this.#armBargeIn();
          break;
        case 'empty':
          break;
        case 'degraded':
          this.ui.onDegraded?.(data.message);
          break;
        case 'hangup':
          hungUp = true;
          break;
        case 'error':
          this.ui.onError?.(data.message);
          break;
        default:
          break;
      }
    });

    await this.#waitForSpeaker();
    this.mic.stopMonitoring();

    if (hungUp) {
      this.ui.onStatus?.('idle', 'Σου έκλεισε το τηλέφωνο.');
      await this.end('hangup');
      return;
    }
    if (!spoke) this.ui.onStatus?.('listening', '');
    this.#listen();
  }

  /** Talking over him cuts him off, exactly like a real call. */
  #armBargeIn() {
    if (this.mic.mode === 'monitoring') return;
    this.mic.monitorForBargeIn(() => {
      if (!this.speaker.busy) return;
      this.speaker.stop();
      this.ui.onStatus?.('listening', 'Τον διέκοψες');
      this.#listen();
    });
  }

  #waitForSpeaker() {
    return new Promise((resolve) => {
      const check = () => (this.speaker.busy ? setTimeout(check, 80) : resolve());
      check();
    });
  }

  async end(reason = 'ended') {
    if (this.over) return null;
    this.over = true;
    this.cancelListen?.();
    try { this.recognition?.abort(); } catch { /* not running */ }
    this.speaker.stop();
    this.mic.close();

    let report = null;
    try {
      const res = await fetch(`/api/call/${this.sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      report = res.ok ? await res.json() : null;
    } catch {
      report = null;
    }
    this.speaker.close();
    this.ui.onFinished?.(report);
    return report;
  }
}

/** Parse an SSE stream from fetch(). */
async function readEvents(stream, handle) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let split;
    while ((split = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, split);
      buffer = buffer.slice(split + 2);
      let event = 'message';
      let data = '';
      for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (event === 'done') return;
      try {
        await handle(event, data ? JSON.parse(data) : {});
      } catch { /* one bad event must not stop the turn */ }
    }
  }
}
