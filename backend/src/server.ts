import app from './app.js';
import { env } from './config/env.js';
import { isGoogleAuthEnabled, isDevGoogleAuthEnabled } from './config/google.js';

const PORT = parseInt(env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  console.log(`📡 API URL: ${env.API_URL}`);
  console.log(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
  console.log(
    isGoogleAuthEnabled()
      ? '✅ Google OAuth enabled'
      : isDevGoogleAuthEnabled()
        ? '✅ Google dev sign-in enabled (local demo — no Google Cloud needed)'
        : '⚠️  Google OAuth disabled — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
  );
});
