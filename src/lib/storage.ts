import fs from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export interface StorageProvider {
  save(filename: string, buffer: Buffer, contentType: string): Promise<string>;
  delete(filename: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor(uploadDir: string = UPLOAD_DIR) {
    this.uploadDir = uploadDir;
  }

  async save(
    filename: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }

      const filePath = path.join(this.uploadDir, filename);
      fs.writeFileSync(filePath, buffer);

      return `/uploads/${filename}`;
    } catch (error: any) {
      if (error.code === 'EROFS' || error.message?.includes('read-only')) {
        console.warn("Read-only filesystem detected. Falling back to Base64 Data URL storage.");
        const base64 = buffer.toString('base64');
        return `data:${contentType};base64,${base64}`;
      }
      throw error;
    }
  }

  async delete(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

export class S3StorageProvider implements StorageProvider {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;
  private publicUrl: string;

  constructor() {
    const region = process.env.AWS_REGION || "us-east-1";
    const bucket = process.env.AWS_S3_BUCKET_NAME || "";
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";

    if (!bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "Missing AWS S3 configuration. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME, and AWS_REGION environment variables."
      );
    }

    this.bucket = bucket;
    this.region = region;
    this.publicUrl =
      process.env.AWS_S3_PUBLIC_URL ||
      `https://${bucket}.s3.${region}.amazonaws.com`;

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async save(
    filename: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    const key = `uploads/${filename}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    return `${this.publicUrl}/${key}`;
  }

  async delete(filename: string): Promise<void> {
    const key = `uploads/${filename}`;

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch (error) {
      console.error("Error deleting from S3:", error);
    }
  }
}

let storageProviderInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (storageProviderInstance) {
    return storageProviderInstance;
  }

  const provider = process.env.STORAGE_PROVIDER || "local";

  switch (provider) {
    case "s3":
      try {
        storageProviderInstance = new S3StorageProvider();
      } catch (error) {
        console.error(
          "Failed to initialize S3 storage, falling back to local:",
          error
        );
        storageProviderInstance = new LocalStorageProvider();
      }
      break;
    case "local":
    default:
      storageProviderInstance = new LocalStorageProvider();
      break;
  }

  return storageProviderInstance;
}

// Reset storage provider (useful for testing or when env changes)
export function resetStorageProvider(): void {
  storageProviderInstance = null;
}
