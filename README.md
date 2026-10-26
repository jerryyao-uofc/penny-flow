# Penny Flow

Penny Flow is a personal dictation app. Speech is turned into text on this computer, then DeepSeek rewrites it before it is pasted.

## Acknowledgement

The idea and the app started from [Handy](https://github.com/cjpais/Handy), the open-source speech-to-text project by CJ Pais. Local transcription, shortcuts, history, and settings come from that project. Thank you to Handy and everyone who works on it.

Penny Flow is a personal modification, not an official Handy release. Handy is MIT licensed. The copyright and license notice are in `LICENSE`.

## Goal

This is for personal use. When a transcript is longer than five English words, or has more than six Chinese (Han) characters, Penny Flow sends it to DeepSeek. The rewrite drops fillers in English and Chinese, keeps mixed Chinese/English as written, and returns a concise, grammatical result.

The point is a free, or about 95% cheaper, version of the Whisper Flow transcription feature: a local speech model on this machine, plus a small DeepSeek call, instead of a Whisper Flow subscription.

## Features

- Local speech-to-text with optional DeepSeek rewrite
- **Text Refine** — select text, press Option+1/2/3 (when enabled), rewrite with a custom prompt
- **Analytics** — lifetime counters in Settings (survive the five-hour history wipe)
- Settings, API key, and downloaded models stay under `~/Library/Application Support/com.pais.handy/` (bundle id `com.pais.handy`)

## Run (dev)

From this folder:

```bash
bun tauri dev
```

Add a DeepSeek API key under Settings → Post Process. The key stays in local settings on this Mac. It is not part of this repository.

## Install / update locally

Use the continuity-safe installer so a new build does **not** wipe settings, analytics, or the speech model:

```bash
./install-local.sh --build
```

Or after you already built:

```bash
bun tauri build
./install-local.sh
```

That script:

1. Quits any running Penny Flow
2. Optionally builds the release app
3. Re-signs ad-hoc with entitlements
4. Replaces **only** `/Applications/Penny Flow.app` (never Application Support or `~/.cache/huggingface/`)
5. Launches the new app

You do not re-download the model or re-enter settings unless you delete that Application Support folder yourself. Never change the Tauri `identifier` away from `com.pais.handy` — that would orphan settings.

Microphone / Accessibility / Input Monitoring are tied to the app path and signature. Keeping `/Applications/Penny Flow.app` and the same bundle id maximizes continuity. Ad-hoc signing can still prompt again after some rebuilds; if Accessibility stops working, re-enable Penny Flow once in System Settings — your settings and model are still there.
