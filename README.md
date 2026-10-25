# Penny Flow

Penny Flow is a personal dictation app. Speech is turned into text on this computer, then DeepSeek rewrites it before it is pasted.

## Acknowledgement

The idea and the app started from [Handy](https://github.com/cjpais/Handy), the open-source speech-to-text project by CJ Pais. Local transcription, shortcuts, history, and settings come from that project. Thank you to Handy and everyone who works on it.

Penny Flow is a personal modification, not an official Handy release. Handy is MIT licensed. The copyright and license notice are in `LICENSE`.

## Goal

This is for personal use. When a transcript is longer than five words, Penny Flow sends it to DeepSeek. The rewrite drops filler such as “I mean,” “well,” and “yeah,” and returns a concise, grammatical sentence.

The point is a free, or about 95% cheaper, version of the Whisper Flow transcription feature: a local speech model on this machine, plus a small DeepSeek call, instead of a Whisper Flow subscription.

For now, Penny Flow only supports English.

## Run

From this folder:

```bash
bun tauri dev
```

Add a DeepSeek API key under Settings → Post-processing. The key stays in the app’s local settings on this Mac. It is not part of this repository.
