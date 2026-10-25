declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    TRAINING_ADMIN_EMAIL?: string;
    PROJECT_ARCHIVE_ROOT?: string;
    BUCKET?: R2Bucket;
  }
}
