# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LUNA is an Express + TypeScript API that generates soothing bedtime stories for adults. A request carries a `topic`, `mood`, and `length`; the API asks Gemini to write a script, hands the script to ElevenLabs for narration, and streams back `audio/mpeg`.

## Commands

```bash
npm run dev      # start the server with tsx watch (hot reload) on PORT (default 3000)
npm run player   # open tests/player.html, a browser client for hitting /stories/generate
```

There is no test runner, linter, or build step configured yet. `tsx` runs the TypeScript directly, so no compile step is needed to run locally.

Set up `.env` from `.env.example` before running. Required keys: `GEMINI_API_KEY`, `GEMINI_MODEL`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL`. Set `NODE_ENV=development` to log request bodies and story word counts.

## Architecture

The code follows a feature-based layout. Each HTTP concern lives in its own layer, and a request flows through them in order:

1. `src/server.ts` loads env and starts the listener.
2. `src/app.ts` wires global middleware (CORS, JSON body parsing, request logging), mounts feature routers, and registers the error handler last.
3. `src/features/<feature>/` holds one feature. `stories` is the model to follow:
   - `stories.routes.ts` — Express router; parses the request, calls the service, streams the result.
   - `stories.validation.ts` — turns raw `req.body` into a typed DTO, throwing `BadRequestError` on bad input.
   - `stories.service.ts` — the business logic; builds prompts and orchestrates the shared AI services.
   - `stories.dto.ts` — the shared types and constants (e.g. `LENGTHS`) for the feature.
4. `src/shared/` holds provider clients used across features: `gemini.service.ts` (text) and `elevenlabs.service.ts` (audio).
5. `src/middleware/` holds cross-cutting concerns: `errors.ts` and `requests.ts`.

### Error handling

`src/middleware/errors.ts` defines an `AppError` base class with typed subclasses (`BadRequestError`, `NotFoundError`, `ConflictError`). Throw one of these anywhere in a route or service; routes forward errors with `next(e)` and `errorMiddleware` maps them to a JSON response `{ error: { code, message, details } }`. Anything that is not an `AppError` becomes a generic 500. Because the error handler must run last, keep it as the final `app.use` in `app.ts`.

### The generation flow

`POST /stories/generate` is the one real endpoint (plus `GET /health`). Its path: validate → `service.generate` builds a system instruction and a `Topic/Mood/Length` prompt → `gemini.completion` returns the story text → `elevenlabs.generate` returns a `Readable` audio stream → the route streams chunks to the client with `Content-Type: audio/mpeg`. The `length` enum maps to target word counts in `lengthToWordCount` inside the service.

## Conventions

- Import a module's exports as a namespace and call them by role: `import * as service`, `import * as validate`, `import * as gemini`.
- Validators live in the feature's validation file and return a typed DTO; keep controllers thin and push logic into services.
- Provider SDK clients stay in `src/shared/` so features share one configured instance.
- TypeScript is strict, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`; `verbatimModuleSyntax` is on, so use `import type` for type-only imports.
