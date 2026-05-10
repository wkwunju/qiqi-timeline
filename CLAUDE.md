# CLAUDE.md

Auto-loaded when Claude Code starts inside `/Users/wenkai/qiqi-timeline/`. This is the minimum context for safely changing the project. Longer reference: `/Users/wenkai/Documents/wwk/qiqi-timeline.md`.

## What this is

A minimalist baby photo/video timeline for 骐骐 (qiqi). Single static HTML on GitHub Pages, with a Cloudflare Worker for password-gated uploads and an R2 bucket for media.

- Live: https://wkwunju.github.io/qiqi-timeline/
- API:  https://qiqi-api.qiqi-baby.workers.dev
- Repo: github.com/wkwunju/qiqi-timeline (public)
- R2 bucket: `qiqi-photos` (private)

## File map

- `index.html` — single-page frontend. Top of `<script>`:
  - `API_URL` — Worker endpoint
  - `BIRTH_DATE = '2026-03-21'` — drives age display
- `lullaby.mp3` — click-to-play background music (referenced by `<audio src>`)
- `worker/src/index.js` — endpoints: `GET /manifest`, `GET /photos/<name>`, `POST /verify | /upload | /edit | /delete`. All mutating endpoints check `x-password` against the `UPLOAD_PASSWORD` Worker secret.
- `worker/wrangler.toml` — binds R2 `qiqi-photos` to env var `PHOTOS`.
- `.gitignore` — excludes `worker/.wrangler/`. Don't commit anything in there.

## Manifest shape (in R2 as `manifest.json`)

```json
{ "id": "...", "photo": "<id>.<ext>", "type": "image|video",
  "date": "YYYY-MM-DD", "age": "...", "caption": "...", "createdAt": "..." }
```

`type` may be missing on legacy entries → treat as image.

## Deployment

| Change | Steps |
| --- | --- |
| Frontend (`index.html`, `lullaby.mp3`, etc.) | `git add -A && git commit && git push` — GitHub Pages rebuilds in ~1 min |
| Worker (`worker/src/`) | `cd worker && wrangler deploy` — then commit+push so the repo matches |
| Upload password | `cd worker && wrangler secret put UPLOAD_PASSWORD` (silently overwrites) |
| Background music | replace `lullaby.mp3`, push. Public-domain sources: archive.org/details/freepd |

## Conventions (don't break these)

- **Single static file**: no build step, no npm dependencies for the frontend.
- **Design**: Cormorant Garamond + Noto Serif SC, `--bg: #faf8f5`, `--accent: #b89d7d`. Don't add chrome.
- **No emojis** in user-facing copy or commits unless explicitly asked.
- **No comments** in code unless WHY is non-obvious.
- **Secrets**: `UPLOAD_PASSWORD` lives only as a Worker secret. Never write it into a file.
- **Don't commit `worker/.wrangler/`** (cache + account info). Check `git status` before staging.

## Common errors

- 401 on upload → password mismatch; tell user to re-set with `wrangler secret put UPLOAD_PASSWORD`.
- 413 on upload → file too big. Image cap 10MB, video cap 90MB.
- "加载失败" on the page → check `${API_URL}/manifest` in DevTools; if the Worker is the issue, look at the Worker logs in the Cloudflare dashboard.
- `wrangler` auth errors → ask the user to run `wrangler login` themselves.

## Sub-agent

A user-level sub-agent at `~/.claude/agents/qiqi-timeline.md` covers cases where Claude Code is started outside this directory. If you ARE inside this directory, this CLAUDE.md is the source of truth — the sub-agent's instructions are similar but redundant here.
