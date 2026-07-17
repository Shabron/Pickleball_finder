const { initializeApp, cert } = require('firebase-admin/app');

let app = null;
let initAttempted = false;

/**
 * Lazily initializes the Firebase Admin SDK from env vars.
 * Returns null (never throws) if credentials aren't configured, so the
 * server can boot and run fine with push notifications simply disabled.
 */
const getFirebaseApp = () => {
  if (initAttempted) return app;
  initAttempted = true;

  try {
    let credentialJson;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      credentialJson = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
      );
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      credentialJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
      console.warn('[firebaseAdmin] No Firebase service account configured — push notifications are disabled.');
      return null;
    }

    app = initializeApp({
      credential: cert(credentialJson),
    });
    console.log('[firebaseAdmin] Firebase Admin initialized — push notifications enabled.');
  } catch (error) {
    console.error('[firebaseAdmin] Failed to initialize Firebase Admin:', error.message);
    app = null;
  }

  return app;
};

module.exports = { getFirebaseApp };
