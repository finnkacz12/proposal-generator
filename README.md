# Proposal Framework Generator

AI-powered tool that turns sales call transcripts into structured proposal frameworks with hour estimates.

## Deploy to Vercel (Step-by-Step)

### Prerequisites
- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (free tier works)
- An [Anthropic API key](https://console.anthropic.com/settings/keys)

---

### Step 1: Push to GitHub

Create a new repo on GitHub, then push this project:

```bash
cd proposal-generator
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/proposal-generator.git
git push -u origin main
```

Or use the GitHub CLI:
```bash
gh repo create proposal-generator --private --source=. --push
```

---

### Step 2: Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your `proposal-generator` repo
4. Vercel auto-detects Vite — leave the defaults:
   - **Framework Preset:** Vite
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables** and add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your API key starting with `sk-ant-...`
6. Click **Deploy**

That's it. Vercel will build the frontend and deploy the `/api/claude` serverless function automatically.

---

### Step 3: Use It

Your app will be live at `https://proposal-generator-xxxxx.vercel.app` (Vercel assigns a URL).

You can add a custom domain in Vercel's project settings under **Domains**.

---

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local with your API key
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env.local

# Run dev server
npm run dev
```

Note: The Vercel serverless function (`/api/claude.js`) won't run with plain `vite dev`. For local development with the API, install and use the Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

This runs both the Vite dev server and the serverless functions locally.

---

## Project Structure

```
proposal-generator/
├── api/
│   └── claude.js          # Serverless function (proxies to Anthropic API)
├── src/
│   ├── App.jsx            # Main proposal generator component
│   └── main.jsx           # React entry point
├── index.html             # HTML shell
├── package.json
├── vite.config.js
├── vercel.json            # Vercel config (60s function timeout)
└── .env.example           # Environment variable template
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key. Get one at [console.anthropic.com](https://console.anthropic.com/settings/keys) |

The API key is only used server-side in the serverless function. It is never sent to the browser.

## Cost

Each proposal generation makes one API call to Claude Sonnet. At current pricing, a typical generation costs roughly $0.02-0.08 depending on transcript length. Chat follow-ups are smaller. You can monitor usage at [console.anthropic.com](https://console.anthropic.com).
