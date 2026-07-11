# LUNA API

An Express + TypeScript API that generates soothing bedtime stories for adults. Send a topic, mood, and length; LUNA writes the story with a multi-agent Gemini pipeline, narrates it with ElevenLabs, hosts the audio on DigitalOcean Spaces, and returns JSON with a playable URL.

## How it works

```
Request (topic, mood, narratorType, length)
        │
        ▼
  Validation
        │
        ▼
  Gemini pipeline ── outline ─▶ characters ┐
                              └▶ setting   ┴─▶ final story ─▶ tone/narration tags
        │
        ▼
  ElevenLabs (narrates the story → MP3 buffer)
        │
        ▼
  music-metadata (measures duration) + DigitalOcean Spaces (hosts the MP3)
        │
        ▼
  Response 201: { id, title, story, audioUrl, durationSeconds }
```

## Requirements

- Node.js (with `npm`)
- A [Gemini](https://ai.google.dev/) API key
- An [ElevenLabs](https://elevenlabs.io/) API key
- A [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces) bucket (S3-compatible) with CDN enabled

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
| `ELEVENLABS_MODEL` | ElevenLabs model id, e.g. `eleven_v3` |
| `DO_SPACES_ENDPOINT` | Spaces origin endpoint, e.g. `https://nyc3.digitaloceanspaces.com` |
| `DO_SPACES_REGION` | Spaces region, e.g. `nyc3` |
| `DO_SPACES_KEY` | Spaces access key id |
| `DO_SPACES_SECRET` | Spaces secret access key |
| `DO_SPACES_BUCKET` | Bucket name that holds the audio |
| `DO_SPACES_CDN_ENDPOINT` | CDN base URL used to build the returned `audioUrl` |

Uploads are keyed under `luna/` in production and `luna-dev/` when `NODE_ENV=development`, and are made `public-read` so the returned URL streams directly.

## Running

```bash
npm run dev      # start the server with hot reload
npm run player   # open tests/player.html to try it in the browser
```

## API

### `GET /health`

Returns `200` with `{ "status": "ok" }`.

### `POST /stories/generate`

Generates a narrated bedtime story, hosts the audio, and returns `201` with a JSON body.

**Request body**

| Field | Type | Rules |
| --- | --- | --- |
| `topic` | string | 3–100 characters |
| `mood` | string | 3–50 characters |
| `narratorType` | string | one of `adaptive`, `default`, `warm`, `soft`, `deep` |
| `length` | string | one of `short`, `medium`, `long` |

`length` maps to a target size: `short` ≈ 50–150 words, `medium` ≈ 200–500 words, `long` ≈ 1000–1500 words. `narratorType` picks the ElevenLabs voice — `adaptive` and `default` use `ELEVENLABS_VOICE_ID`, while `warm` / `soft` / `deep` map to preset voice ids.

**Response** `201 Created`

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Story id (currently a placeholder until persistence is added) |
| `title` | string | Gemini-generated title |
| `story` | string | Full narrated text, including ElevenLabs v3 tone tags |
| `audioUrl` | string | Public CDN URL of the narrated MP3 |
| `durationSeconds` | number | Audio length in seconds, measured from the MP3 |

**Example**

```bash
curl -X POST http://localhost:3000/stories/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "a quiet lighthouse", "mood": "calm", "narratorType": "warm", "length": "short"}'
```

```json
{
  "id": "placeholder (replace when persistence is added)",
  "title": "The Keeper of the Quiet Light",
  "story": "[whispers] The lighthouse stood at the edge of the world...",
  "audioUrl": "https://luna.nyc3.cdn.digitaloceanspaces.com/luna/8f3c....mp3",
  "durationSeconds": 92
}
```

**Errors**

Errors return JSON in the shape:

```json
{ "error": { "code": "BAD_REQUEST", "message": "topic must have more than 3 characters" } }
```

Invalid input returns `400`; unexpected failures return `500`.

## Story generation pipeline

`/stories/generate` runs a chain of small Gemini agents (`src/features/stories/stories.agents.ts`), each returning structured JSON:

1. **Outliner** — turns the request into a sequence of story beats.
2. **Character designer** and **setting designer** — run in parallel off the outline.
3. **Final writer** — composes the title and full story from the outline, characters, and setting.
4. **Tone annotator** — adds restrained ElevenLabs v3 audio tags (e.g. `[whispers]`, `[sigh]`) for narration.

The finished story is sent to ElevenLabs for narration, measured with `music-metadata`, and uploaded to Spaces. A simpler all-at-once path (`simpleGeneration`) also exists in the service as a fallback.

## Integration status

The client for this API is the **Luna** Flutter app (`../luna`). The response now matches the app's expected contract; one gap remains.

**Agreed (works today):**

- Endpoint `POST /stories/generate` and the `topic` / `mood` / `length` fields.
- The `length` values `short` / `medium` / `long`.
- The JSON response `{ id, title, story, audioUrl, durationSeconds }` with a remote `audioUrl`.
- The error shape `{ error: { code, message } }`.

**Gaps to close:**

- **`narratorType` is required, but the app omits it.** This API now validates a required `narratorType` (`adaptive` / `default` / `warm` / `soft` / `deep`), so a request without it returns `400`. The app keeps its voice choice local and its `toRequestJson` sends only `{ topic, mood, length }`. Either the app should send `narratorType` (its `voice` field maps naturally, with "Adaptive" → `adaptive`) or the API should default it when absent.
- **Story length.** This API targets 50–150 / 200–500 / 1000–1500 words. The app promises ~5 / ~10 / ~15 minutes (~600–700 / 1,200–1,400 / 1,800–2,100 words). The `lengthToWordCount` targets in `stories.service.ts` need to grow to match.

## Project structure

```
src/
├── server.ts                 # loads env, starts the listener
├── app.ts                    # middleware, routes, error handler
├── middleware/
│   ├── requests.ts           # request logging
│   └── errors.ts             # AppError types + error handler
├── shared/
│   ├── gemini.service.ts     # structured-JSON text generation client
│   ├── elevenlabs.service.ts # audio narration client
│   └── spaces.service.ts     # uploads MP3s to DigitalOcean Spaces
└── features/
    └── stories/
        ├── stories.routes.ts      # POST /stories/generate
        ├── stories.validation.ts  # validates + types the request body
        ├── stories.service.ts     # orchestrates the pipeline: text → audio → host
        ├── stories.agents.ts      # the individual Gemini agents
        ├── stories.types.ts       # internal pipeline types
        └── stories.dto.ts         # request/response types and constants
```
