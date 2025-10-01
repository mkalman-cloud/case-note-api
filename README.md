
# Case-Note API (Vercel)

Serverless endpoint for generating youth development case notes using OpenAI.

## Endpoints
- POST `/api/casenote` → { note }

### Body
```json
{
  "transcript": "string",
  "client": "string (optional)"
}
```

### Env Vars (Vercel → Settings → Environment Variables)
- `OPENAI_API_KEY` = your key

### Deploy
Import this repo into Vercel → Add env var → Deploy.
