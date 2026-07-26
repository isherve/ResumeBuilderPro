# Deploy ResumeBuilder Pro

Code is on GitHub: https://github.com/isherve/ResumeBuilderPro

## Your URLs (after deploy)

| Service | Expected URL |
|---------|----------------|
| **Frontend (Vercel)** | `https://resume-builder-pro.vercel.app` or `https://resume-builder-pro-git-main-isherve.vercel.app` |
| **Backend (Railway/Render)** | Shown in dashboard after deploy, e.g. `https://resume-builder-api.up.railway.app` |

---

## 1. Deploy backend (Railway — free)

1. Open: **https://railway.com/new**
2. **Deploy from GitHub repo** → select `isherve/ResumeBuilderPro`
3. Set **Root Directory** to `backend`
4. Add **PostgreSQL** plugin (Variables → add database)
5. Set variables:

```
NODE_ENV=production
JWT_SECRET=<random-32-chars>
JWT_REFRESH_SECRET=<random-32-chars>
FRONTEND_URL=https://YOUR-VERCEL-URL.vercel.app
API_URL=https://YOUR-RAILWAY-URL.up.railway.app
GOOGLE_CALLBACK_URL=https://YOUR-RAILWAY-URL.up.railway.app/api/auth/google/callback
```

6. Copy your **Railway public URL** from Settings → Networking → Generate Domain

**One-click Railway login (if CLI asked):** https://railway.com/activate

---

## 2. Deploy frontend (Vercel — free)

1. Open: **https://vercel.com/new/clone?repository-url=https://github.com/isherve/ResumeBuilderPro**
2. **Root Directory:** `frontend`
3. Environment variable:

```
VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app/api
```

4. Deploy → copy your **Vercel URL**

---

## 3. Google OAuth (production)

In Google Cloud → Credentials → OAuth client:

**Authorized JavaScript origins:**
```
https://YOUR-VERCEL-URL.vercel.app
```

**Authorized redirect URIs:**
```
https://YOUR-RAILWAY-URL.up.railway.app/api/auth/google/callback
```

Add test user: `ishimwehervin10@gmail.com`

Then add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Railway variables.

---

## Alternative: Render backend

https://render.com/deploy?repo=https://github.com/isherve/ResumeBuilderPro

Uses `render.yaml` in repo root.
