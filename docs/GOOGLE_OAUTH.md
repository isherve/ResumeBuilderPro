# Google Sign-In Setup

Follow these steps to enable **Continue with Google** on login and register.

## 1. Create Google OAuth credentials

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select an existing one)
3. Go to **APIs & Services → OAuth consent screen**
   - Choose **External**
   - Fill in app name: `ResumeBuilder Pro`
   - Add your email as developer contact
   - Add scopes: `email`, `profile`, `openid`
   - Add your Gmail as a **Test user** (while app is in Testing mode)
4. Go to **APIs & Services → Credentials**
5. Click **Create Credentials → OAuth client ID**
6. Application type: **Web application**
7. Add **Authorized redirect URIs**:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
8. Copy the **Client ID** and **Client Secret**

## 2. Update backend environment

Edit `backend/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

## 3. Restart the backend

```bash
# Stop and restart dev servers, or restart backend only
npm run dev:backend
```

## 4. Test Google sign-in

1. Open http://localhost:5173/login
2. Click **Continue with Google**
3. Choose your Google account
4. You should land on the dashboard

## Verify configuration

Check status:

```bash
curl http://localhost:5000/api/auth/google/status
```

Expected response when configured:

```json
{"success":true,"data":{"enabled":true,"callbackUrl":"http://localhost:5000/api/auth/google/callback"}}
```

## Production

For deployment, add your production callback URL in Google Console:

```
https://your-api-domain.com/api/auth/google/callback
```

Update production env vars accordingly.
