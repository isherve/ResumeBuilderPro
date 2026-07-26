# Google OAuth for Vercel (Production)

Google Sign-In for your live website needs **two URLs** — not localhost.

## Architecture

| Service | Host | Example URL |
|---------|------|-------------|
| **Frontend** | Vercel | `https://resume-builder-pro.vercel.app` |
| **Backend API** | Railway or Render | `https://resume-builder-api.railway.app` |

Google OAuth callback goes to the **backend**, not Vercel.

Flow:
1. User clicks **Continue with Google** on your Vercel site
2. Browser → `https://YOUR-BACKEND/api/auth/google`
3. Google → `https://YOUR-BACKEND/api/auth/google/callback`
4. Backend → redirects to `https://YOUR-VERCEL-APP/auth/callback?token=...`

---

## Step 1 — Deploy backend first (Railway recommended)

1. Push repo to GitHub
2. [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set root directory: `backend`
4. Add PostgreSQL plugin → copy `DATABASE_URL`
5. Set environment variables:

```env
NODE_ENV=production
PORT=5000
API_URL=https://YOUR-BACKEND.railway.app
FRONTEND_URL=https://YOUR-APP.vercel.app
DATABASE_URL=postgresql://...
JWT_SECRET=generate-a-long-random-string-min-32-chars
JWT_REFRESH_SECRET=another-long-random-string-min-32-chars
GOOGLE_CLIENT_ID=will-add-after-step-2
GOOGLE_CLIENT_SECRET=will-add-after-step-2
GOOGLE_CALLBACK_URL=https://YOUR-BACKEND.railway.app/api/auth/google/callback
```

6. Run migrations in Railway shell:
   ```bash
   npx prisma db push && npm run db:seed
   ```

Copy your Railway URL (e.g. `https://resume-builder-pro-production.up.railway.app`).

---

## Step 2 — Google Cloud OAuth (production)

In [Google Cloud Console](https://console.cloud.google.com/) → **Credentials** → **Create OAuth client ID**:

**Application type:** Web application  
**Name:** `ResumeBuilder Pro Production`

### Authorized JavaScript origins
Add your **Vercel frontend** URL (no trailing slash):

```
https://YOUR-APP.vercel.app
```

If you use a custom domain later, add that too:
```
https://www.yourdomain.com
```

### Authorized redirect URIs
Add your **backend callback** URL (exact):

```
https://YOUR-BACKEND.railway.app/api/auth/google/callback
```

Replace `YOUR-BACKEND.railway.app` with your real Railway/Render URL.

Click **Create** → copy **Client ID** and **Client secret**.

---

## Step 3 — OAuth consent screen (Test users)

**Google Auth Platform → Audience** (or OAuth consent screen):

1. **User type:** External
2. **Test users:** add `ishimwehervin10@gmail.com`
3. While in **Testing** mode, only test users can sign in (fine for launch)

For public launch later: **Publish app** (may require Google verification).

---

## Step 4 — Backend env (Railway)

Update Railway variables:

```env
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_CALLBACK_URL=https://YOUR-BACKEND.railway.app/api/auth/google/callback
FRONTEND_URL=https://YOUR-APP.vercel.app
API_URL=https://YOUR-BACKEND.railway.app
```

Redeploy backend after saving.

---

## Step 5 — Deploy frontend (Vercel)

1. [vercel.com](https://vercel.com) → Import GitHub repo
2. **Root directory:** `frontend`
3. Environment variables:

```env
VITE_API_URL=https://YOUR-BACKEND.railway.app/api
```

4. Deploy

Update `frontend/vercel.json` rewrite destination to your backend URL:

```json
"destination": "https://YOUR-BACKEND.railway.app/api/$1"
```

---

## Step 6 — Test production Google login

1. Open `https://YOUR-APP.vercel.app/login`
2. Click **Continue with Google**
3. Sign in with `ishimwehervin10@gmail.com` (must be in Test users)
4. You should land on `/dashboard`

---

## Common production errors

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Redirect URI in Google Console must **exactly** match backend callback URL |
| `Access blocked` | Add your Gmail under **Test users** |
| Google works locally but not on Vercel | Check `FRONTEND_URL` on backend matches Vercel URL |
| 401 after login | Set `VITE_API_URL` to production backend `/api` |

---

## Replace placeholders

| Placeholder | Your value |
|-------------|------------|
| `YOUR-APP.vercel.app` | Vercel deployment URL |
| `YOUR-BACKEND.railway.app` | Railway/Render API URL |

Send both URLs and your Client ID/Secret and they can be configured in the project.
