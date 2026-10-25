declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    TRAINING_ADMIN_EMAIL?: string;
    PROJECT_ARCHIVE_ROOT?: string;
    FIREBASE_PROJECT_ID?: string;
    FIREBASE_WEB_API_KEY?: string;
    FIREBASE_AUTH_DOMAIN?: string;
    FIREBASE_APP_ID?: string;
    BUCKET?: R2Bucket;
  }
}
