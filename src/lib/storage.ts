import fs from "fs";
import path from "path";

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
    _contentType: string
  ): Promise<string> {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    const filePath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/${filename}`;
  }

  async delete(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

let storageProviderInstance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!storageProviderInstance) {
    const provider = process.env.STORAGE_PROVIDER || "local";

    switch (provider) {
      case "local":
      default:
        storageProviderInstance = new LocalStorageProvider();
        break;
    }
  }

  return storageProviderInstance;
}
