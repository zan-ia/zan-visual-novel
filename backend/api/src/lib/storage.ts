// =============================================================================
// Storage Strategy Pattern
// =============================================================================
// Provides two storage backends via a common interface:
//   - LocalStorageProvider  (local filesystem, for development/testing)
//   - S3StorageProvider     (S3-compatible: MinIO, R2, AWS S3, etc.)
//
// Use `createStorageProvider()` to get the configured provider based on env vars.
// =============================================================================

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListBucketsCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';

// ── Interface ───────────────────────────────────────────

export interface StorageProvider {
  upload(buffer: Buffer, originalName: string, mimeType: string): Promise<{ url: string }>;
  delete(url: string): Promise<void>;
}

// ── Local Storage ──────────────────────────────────────

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;
  private baseUrl: string;

  constructor(baseDir = 'uploads', baseUrl = '/uploads') {
    this.baseDir = baseDir;
    this.baseUrl = baseUrl;
    if (!existsSync(this.baseDir)) mkdirSync(this.baseDir, { recursive: true });
  }

  async upload(buffer: Buffer, originalName: string, _mimeType: string): Promise<{ url: string }> {
    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
    const ext = extname(originalName) || '.bin';
    const filename = `${hash}${ext}`;
    const filepath = join(this.baseDir, filename);
    writeFileSync(filepath, buffer);
    return { url: `${this.baseUrl}/${filename}` };
  }

  async delete(url: string): Promise<void> {
    const filename = url.split('/').pop();
    if (!filename) return;
    const filepath = join(this.baseDir, filename);
    if (existsSync(filepath)) unlinkSync(filepath);
  }
}

// ── S3 Storage ─────────────────────────────────────────

export interface S3StorageConfig {
  region: string;
  endpoint?: string;
  bucket: string;
  publicUrlBase: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrlBase: string;

  constructor(config: S3StorageConfig) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? false,
    });
    this.bucket = config.bucket;
    this.publicUrlBase = config.publicUrlBase.replace(/\/+$/, '');
  }

  async upload(buffer: Buffer, originalName: string, mimeType: string): Promise<{ url: string }> {
    const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 16);
    const ext = extname(originalName) || '.bin';
    const key = `assets/${hash}${ext}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return { url: `${this.publicUrlBase}/${key}` };
  }

  async delete(url: string): Promise<void> {
    const key = url.replace(this.publicUrlBase + '/', '');
    if (!key) return;
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
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
      // Set public-read policy for assets/ prefix
      await this.client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucket,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucket}/assets/*`],
              },
            ],
          }),
        }),
      );
      console.log(`🔓 Public-read policy applied to "${this.bucket}/assets/*"`);
    } catch (err) {
      console.warn(
        `⚠️ Could not verify/create/configure S3 bucket "${this.bucket}":`,
        (err as Error).message,
      );
    }
  }
}

// ── Factory ────────────────────────────────────────────

export function createStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'local';

  if (provider === 's3') {
    return new S3StorageProvider({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT,
      bucket: process.env.S3_BUCKET || 'zan-vn-assets',
      publicUrlBase: process.env.S3_PUBLIC_URL || 'http://localhost:9000',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
      forcePathStyle: true,
    });
  }

  return new LocalStorageProvider();
}

// ── Singleton (backward-compatible alias) ───────────────

let instance: StorageProvider | null = null;

/**
 * @deprecated Use `createStorageProvider()` instead. Kept for backward compatibility.
 */
export function getStorage(): StorageProvider {
  if (!instance) {
    instance = createStorageProvider();
  }
  return instance;
}

/**
 * Reset the singleton (useful for tests).
 */
export function resetStorage(): void {
  instance = null;
}
