// =============================================================================
// S3-compatible Storage Service
// =============================================================================
// Uses @aws-sdk/client-s3 to interface with any S3-compatible storage:
//   - MinIO (local development)
//   - Cloudflare R2
//   - AWS S3
//   - Any other S3-compatible provider
// =============================================================================

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListBucketsCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';

// ── Config ──────────────────────────────────────────────

export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
}

function loadConfig(): StorageConfig {
  return {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'zan-vn-assets',
    publicUrl: process.env.S3_PUBLIC_URL || 'http://localhost:9000/zan-vn-assets',
  };
}

// ── Service ─────────────────────────────────────────────

export class StorageService {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(config: StorageConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO (path-style URLs)
    });
    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl.replace(/\/+$/, ''); // Strip trailing slash
  }

  /**
   * Upload a file to S3-compatible storage.
   * @returns The storage URL (key path within the bucket)
   */
  async upload(key: string, body: Buffer | Uint8Array | Blob, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return key;
  }

  /**
   * Delete a file from S3-compatible storage.
   */
  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  /**
   * Get the full public URL for a stored object.
   */
  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  /**
   * Ensure the configured bucket exists. Create it if necessary.
   */
  async ensureBucket(): Promise<void> {
    try {
      const { Buckets } = await this.client.send(new ListBucketsCommand({}));
      const exists = Buckets?.some((b) => b.Name === this.bucket);
      if (!exists) {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        console.log(`✅ S3 bucket "${this.bucket}" created`);
      }
    } catch (err) {
      console.warn(`⚠️ Could not verify/create S3 bucket "${this.bucket}":`, (err as Error).message);
    }
  }
}

// ── Singleton ───────────────────────────────────────────

let instance: StorageService | null = null;

export function getStorage(): StorageService {
  if (!instance) {
    instance = new StorageService(loadConfig());
  }
  return instance;
}

/**
 * Reset the singleton (useful for tests).
 */
export function resetStorage(): void {
  instance = null;
}
