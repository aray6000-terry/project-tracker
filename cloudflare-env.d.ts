declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    TRAINING_ADMIN_EMAIL?: string;
    BUCKET?: R2Bucket;
  }
}
