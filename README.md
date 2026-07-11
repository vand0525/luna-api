# LUNA API

An Express + TypeScript API that generates soothing bedtime stories for adults. Send a topic, mood, and length; LUNA writes a script with Gemini, narrates it with ElevenLabs, and streams back an MP3.

## How it works

```
Request (topic, mood, length)
        │
        ▼
  Validation ──▶ Gemini (writes the story text)
                        │
                        ▼
                 ElevenLabs (narrates the text)
                        │
                        ▼
        Response: audio/mpeg stream
```

## Requirements

- Node.js (with `npm`)
- A [Gemini](https://ai.google.dev/) API key
- An [ElevenLabs](https://elevenlabs.io/) API key

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
| --- | --- |
| `PORT` | Port to listen on (defaults to `3000`) |
| `NODE_ENV` | Set to `development` to log request bodies and story word counts |
| `GEMINI_API_KEY` | Gemini API key |
| `GEMINI_MODEL` | Gemini model id, e.g. `gemini-2.5-flash` |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | Voice id to narrate the story |
| `ELEVENLABS_MODEL` | ElevenLabs model id, e.g. `eleven_multilingual_v2` |

## Running

```bash
npm run dev      # start the server with hot reload
npm run player   # open tests/player.html to try it in the browser
```

## API

### `GET /health`

Returns `200` with `{ "status": "ok" }`.

### `POST /stories/generate`

Generates a narrated bedtime story and streams it back as `audio/mpeg`.

**Request body**

| Field | Type | Rules |
| --- | --- | --- |
| `topic` | string | 3–100 characters |
| `mood` | string | 3–50 characters |
| `length` | string | one of `short`, `medium`, `long` |

`length` maps to a target size: `short` ≈ 50–150 words, `medium` ≈ 200–500 words, `long` ≈ 1000–1500 words.

**Example**

```bash
curl -X POST http://localhost:3000/stories/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "a quiet lighthouse", "mood": "calm", "length": "short"}' \
  --output story.mp3
```

**Errors**

Errors return JSON in the shape:

```json
{ "error": { "code": "BAD_REQUEST", "message": "topic must have more than 3 characters" } }
```

Invalid input returns `400`; unexpected failures return `500`.

## Integration status

The client for this API is the **Luna** Flutter app (`../luna`). Today the two agree on the request but differ on the response, so they do not yet talk end to end.

**Agreed (works today):**

- Endpoint `POST /stories/generate` and request body `{ topic, mood, length }`.
- The `length` values `short` / `medium` / `long`.
- The error shape `{ error: { code, message } }`.

**Contract gaps to close before wiring the app in:**

1. **Response format.** This API streams raw `audio/mpeg`. The app expects JSON `{ id, title, story, audioUrl, durationSeconds }` and needs a *remote* `audioUrl` (its player caches by URL). Closing this means hosting the generated MP3 (S3/GCS/etc.) and returning its URL plus a Gemini-written `title` and a computed `durationSeconds`.
2. **Story length.** This API targets 50–150 / 200–500 / 1000–1500 words. The app promises ~5 / ~10 / ~15 minutes (~600–700 / 1,200–1,400 / 1,800–2,100 words). The word-count targets in `stories.service.ts` need to grow to match.

## Project structure

```
src/
├── server.ts                 # loads env, starts the listener
├── app.ts                    # middleware, routes, error handler
├── middleware/
│   ├── requests.ts           # request logging
│   └── errors.ts             # AppError types + error handler
├── shared/
│   ├── gemini.service.ts     # text generation client
│   └── elevenlabs.service.ts # audio narration client
└── features/
    └── stories/
        ├── stories.routes.ts      # POST /stories/generate
        ├── stories.validation.ts  # validates + types the request body
        ├── stories.service.ts     # builds prompts, orchestrates the AI calls
        └── stories.dto.ts         # shared types and constants
```
