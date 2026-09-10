# MAKIS — Greek cold-call training bot

A voice roleplay partner for practising cold calls in Greek. You call **Μάκης
Παπαδόπουλος**, a busy, sceptical Greek small-business owner. He picks up, you pitch
websites and monthly maintenance, and he fights you the whole way — the nephew who builds
sites for free, word of mouth, "why pay every month", "send me an email". When you hang
up he drops the character and grades the call out of 10 with blunt feedback on what you
did badly.

Everything he says and everything the interface says is **in Greek only**.

```bash
npm start            # no keys needed to try it — see "Rehearsal mode" below
open http://localhost:3000
```

---

## Contents

1. [What you need to install](#1-what-you-need-to-install)
2. [Rehearsal mode — run it right now, no accounts](#2-rehearsal-mode--run-it-right-now-no-accounts)
3. [The three accounts, step by step](#3-the-three-accounts-step-by-step)
4. [Picking his voice](#4-picking-his-voice)
5. [What it costs (it is free)](#5-what-it-costs-it-is-free)
6. [How it works](#6-how-it-works)
7. [Using it well](#7-using-it-well)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. What you need to install

**Node.js 22.5 or newer** — that is the only prerequisite. Check with `node -v`.
If you need it: [nodejs.org](https://nodejs.org) → LTS.

There are **no npm dependencies**. `npm install` does nothing, and there is nothing that
can break during an install. The server is plain Node, the frontend is plain HTML/CSS/JS,
the database is Node's built-in SQLite.

Browser: **Chrome or Edge** recommended. Safari and Firefox work once you add a Groq key
(step 3.1); without one they cannot do speech recognition.

---

## 2. Rehearsal mode — run it right now, no accounts

```bash
cd makis
npm start
```

Open <http://localhost:3000>, allow the microphone, press **ΕΝΑΡΞΗ ΚΛΗΣΗΣ**.

With no API keys at all the app still runs: your browser does the speech recognition and
the speaking, and MAKIS answers from a fixed but stateful script. It is enough to see the
call loop, the coach report and the history working. It is **not** the real thing — his
voice is robotic and he cannot reason about what you actually said. Add the keys below and
it becomes a real conversation.

---

## 3. The three accounts, step by step

All three have free tiers. Copy `.env.example` to `.env` first:

```bash
cp .env.example .env
```

Then fill in the keys as you create them. After each one, run `npm run doctor` — it tells
you exactly what is working and what is not.

### 3.1 Groq — his ears (free, no credit card)

Groq runs OpenAI's Whisper large-v3, which is the best Greek speech recognition available
at any price. Their free tier is 2,000 requests and 8 hours of audio per day — you will
never reach it.

1. Go to <https://console.groq.com> and sign up (Google or GitHub login is fine).
2. Left sidebar → **API Keys** → **Create API Key**. Name it `makis`.
3. Copy the key immediately — it is shown once. It starts with `gsk_`.
4. In `.env`:

```
STT_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
```

No credit card, no billing setup, nothing to cancel.

### 3.2 Google AI Studio — his brain (free, no credit card)

This is what makes him listen, reason and stay in character, and it is also what writes
your coaching report. Gemini Flash handles Greek better than any other free model.

1. Go to <https://aistudio.google.com/apikey> and sign in with your Google account.
2. Click **Create API key** → **Create API key in new project**.
3. Copy the key (starts with `AIza`).
4. In `.env`:

```
LLM_PROVIDER=gemini
GEMINI_API_KEY=AIza_your_key_here
GEMINI_MODEL=gemini-flash-latest
```

> **Do not enable billing on this project.** On the Gemini API, enabling billing removes
> the free tier entirely and every call becomes billable. Leave it alone and it stays free
> at 1,500 requests/day — about 50 practice calls a day.

If `npm run doctor` says the model is not available, it prints the list of models your key
*can* use — put one of those in `GEMINI_MODEL`.

### 3.3 Google Cloud — his voice (free tier, needs a card on file)

This is the one place that asks for a credit card. Google requires a billing account to
exist before it will serve Text-to-Speech, **but Chirp 3: HD gives you 1 million
characters per month free** — roughly 300 ten-minute calls. You would have to practise for
eight hours a day to leave the free tier.

If you would rather not put a card down at all, skip this step: the app falls back to your
browser's Greek voice, and everything else still works. See [alternatives](#if-you-do-not-want-to-add-a-card) below.

1. Go to <https://console.cloud.google.com> (same Google account is fine).
2. Top bar → project dropdown → **New Project** → name it `makis` → **Create**.
3. Make sure the new project is selected in the top bar.
4. **Billing**: menu → **Billing** → **Link a billing account** → **Create billing
   account** → add your card. New accounts also come with free trial credit.
5. Enable the API: search bar → *Cloud Text-to-Speech API* → **Enable**.
   Direct link: <https://console.cloud.google.com/apis/library/texttospeech.googleapis.com>
6. Create the key: menu → **APIs & Services** → **Credentials** → **Create credentials** →
   **API key**. Copy it.
7. **Restrict it** (30 seconds, worth it): on the key → **Edit API key** → *API
   restrictions* → **Restrict key** → tick **Cloud Text-to-Speech API** → **Save**. Now the
   key is useless for anything else, even if it leaks.
8. In `.env`:

```
TTS_PROVIDER=google
GOOGLE_TTS_API_KEY=your_key_here
GOOGLE_TTS_VOICE=el-GR-Chirp3-HD-Charon
```

Then run `npm run doctor` to confirm all three, and `npm start`.

#### If you do not want to add a card

Two options, both one line in `.env`:

* **Browser voice** — `TTS_PROVIDER=browser`. Free forever, no account. Robotic Greek.
* **ElevenLabs** — the most human Greek voice there is, free plan ≈ 10,000 characters per
  month, which is roughly one practice call. Get a key at
  <https://elevenlabs.io> → Profile → API Key, pick a multilingual voice ID from the Voice
  Library, then:

```
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your_key
ELEVENLABS_VOICE_ID=the_voice_id
```

---

## 4. Picking his voice

```bash
npm run voices            # lists every Greek voice your key can use
npm run voices -- --demo  # records a sample of each into data/voice-samples/
```

Play the samples, pick the one that sounds most like a 54-year-old shop owner who does not
want to talk to you, and put its name in `GOOGLE_TTS_VOICE`. Male Chirp 3 HD voices suit
the character; `Charon` is the default because it is the flattest and least "assistant-like".

You can also slow him down slightly — `GOOGLE_TTS_SPEAKING_RATE=0.95` reads as more
sceptical and less scripted.

---

## 5. What it costs (it is free)

| | Free allowance | A 10-minute call uses |
|---|---|---|
| Groq Whisper (hearing) | 2,000 requests/day, 8h audio/day | ~20 requests, ~4 min audio |
| Gemini Flash (brain + coach) | 1,500 requests/day | ~21 requests |
| Google Chirp 3 HD (voice) | 1,000,000 chars/month | ~3,000 chars |

Roughly **300 calls a month inside the free tiers**. The only thing that can bill you is
Google Cloud TTS past a million characters, and if you are worried, set a budget alert in
Billing → Budgets & alerts.

---

## 6. How it works

```
your voice → mic + silence detection (browser)
           → Groq Whisper                    → Greek transcript
           → Gemini Flash + persona state    → { say, mood, patience, trust }
           → Google Chirp 3 HD, sentence by sentence
           → plays while the rest is still being made   (~2s to first sound)
```

**He is hard on purpose.** The model does not decide how tough he is — the server does.
Each call holds `patience` and `trust`, and the model's proposed changes are clamped by the
difficulty profile in `server/persona/difficulty.js`. On **ΔΥΣΚΟΛΟ** patience never
regenerates: repeating yourself, pushing harder or talking in generalities costs you
ground you cannot win back, and when patience runs out he hangs up mid-call. Trust only
rises when you ask a real discovery question or answer the specific objection he just
raised. The business changes every call (taverna, garage, salon, plumber, mini market) so
you cannot rehearse one script.

**The coach is not just vibes.** `server/coach/metrics.js` measures the call in code —
talk/listen ratio from real audio durations, longest monologue, question count, whether
each objection was actually answered, whether you ever asked for a next step — and those
measurements are handed to the model as facts. Hard caps apply: he hung up on you, the
score cannot exceed 5; you asked no questions, it cannot exceed 4; you never attempted a
close, it cannot exceed 7.

**Everything degrades instead of failing.** A dead TTS key means the browser speaks the
same Greek text and the call continues. No LLM key means rehearsal mode. If the coach
model is unreachable, the report is generated from the measurements instead.

```
server/
  config.js            env + provider selection
  db.js                SQLite (sessions, turns)
  http.js              tiny helpers, SSE
  routes/call.js       pick up · turn · hang up · grade
  routes/history.js    past calls, progress
  providers/           stt-groq · llm-gemini · llm-groq · tts-google · tts-elevenlabs
  persona/             makis.js (who he is) · difficulty.js (how hard he is)
  coach/               metrics.js (measured) · rubric.js (judged)
public/                index.html · css/hud.css · js/{app,call,vad,visualizer,report,history}.js
data/                  makis.db + recordings   (gitignored)
```

---

## 7. Using it well

* **Just talk.** There is no push-to-talk. Stop speaking and he answers; the pause that
  ends your turn is about a second.
* **Interrupt him.** Talking over him cuts his audio off, exactly like a real call.
* **He will hang up on ΔΥΣΚΟΛΟ.** That is a result, not a bug — the report will tell you
  which turn lost him.
* **Say nothing and he notices.** Nine seconds of silence and he asks if you are still there.
* Recordings of each turn are kept when Groq is doing the transcription, and play back
  from the report and from any past call in ΙΣΤΟΡΙΚΟ.
* Watch the **ΤΑΣΗ** figure in the history screen: the last three calls against the three
  before them. That number is the whole point of keeping the history.

---

## 8. Troubleshooting

**"Χρειάζεται πρόσβαση στο μικρόφωνο"** — the browser blocked the mic. Click the padlock
in the address bar → Microphone → Allow. Note that microphone access requires `localhost`
or HTTPS; a plain `http://` address on your LAN will not work.

**He answers from the script, not from what I said** — no LLM key. Run `npm run doctor`;
if it says "Κανένα κλειδί LLM", finish step 3.2.

**`npm run doctor` says the Gemini model is not available** — put one of the model names it
lists into `GEMINI_MODEL` in `.env`.

**Google TTS returns 403** — either the Text-to-Speech API is not enabled on the project
(step 3.3.5), or the key restriction does not include it (step 3.3.7).

**"Ξεπεράστηκε το δωρεάν όριο"** — a provider's daily free quota is spent. Switch brains
for the day with `LLM_PROVIDER=groq` (uses the Groq key you already have), or wait for the
quota to reset.

**Nothing is spoken, but the text appears** — TTS failed and the browser fell back. Check
the server log; it prints exactly which provider failed and why.

**His voice sounds robotic** — you are on the browser fallback. `TTS_PROVIDER=google` plus
a working key fixes it.

**Speech recognition does nothing in Safari/Firefox** — those browsers have no Web Speech
API. Add a Groq key (step 3.1) and recognition moves to the server, where every browser
works.

---

## Moving this into its own repository

This folder is self-contained — nothing outside `makis/` is needed:

```bash
cd makis
git init && git add . && git commit -m "MAKIS"
git remote add origin git@github.com:<you>/makis.git
git push -u origin main
```

Your `.env` is gitignored and will not be pushed. Check that before you make the
repository public.
