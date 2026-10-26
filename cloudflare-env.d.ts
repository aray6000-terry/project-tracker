declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    TRAINING_ADMIN_EMAIL?: string;
    PROJECT_ARCHIVE_ROOT?: string;
    SUPABASE_URL?: string;
    SUPABASE_PUBLISHABLE_KEY?: string;
    AUTH_EMAIL_READY?: string;
    AUTH_GOOGLE_READY?: string;
    AUTH_PHONE_READY?: string;
    BUCKET?: R2Bucket;
  }
}
