import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorageProvider } from "@/lib/storage";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_DIMENSION = 100;
const MAX_DIMENSION = 10000;

interface ImageSignature {
  format: string;
  offset: number;
  bytes: number[];
}

const IMAGE_SIGNATURES: ImageSignature[] = [
  { format: "png", offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { format: "jpeg", offset: 0, bytes: [0xff, 0xd8, 0xff] },
  { format: "gif", offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { format: "webp", offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // RIFF....WEBP
  { format: "avif", offset: 4, bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66] }, // ....ftypavif
];

function validateImageBuffer(buffer: Buffer): { valid: boolean; format: string | null } {
  for (const sig of IMAGE_SIGNATURES) {
    if (buffer.length < sig.offset + sig.bytes.length) continue;

    const slice = buffer.slice(sig.offset, sig.offset + sig.bytes.length);
    const matches = sig.bytes.every((byte, i) => slice[i] === byte);

    if (matches) {
      return { valid: true, format: sig.format };
    }
  }

  return { valid: false, format: null };
}

function getExtensionFromFormat(format: string): string {
  const map: Record<string, string> = {
    png: ".png",
    jpeg: ".jpg",
    gif: ".gif",
    webp: ".webp",
    avif: ".avif",
  };
  return map[format] || ".png";
}

async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number } | null> {
  try {
    const sharp = await import("sharp");
    const metadata = await sharp.default(buffer).metadata();
    if (metadata.width && metadata.height) {
      return { width: metadata.width, height: metadata.height };
    }
  } catch {
    // sharp not available, skip dimension check
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file is an image by MIME type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate image content via magic bytes
    const { valid, format } = validateImageBuffer(buffer);
    if (!valid) {
      return NextResponse.json(
        { error: "File content does not match a valid image format" },
        { status: 400 }
      );
    }

    // Validate image dimensions (optional - requires sharp)
    const dimensions = await getImageDimensions(buffer);
    if (dimensions) {
      if (
        dimensions.width < MIN_DIMENSION ||
        dimensions.height < MIN_DIMENSION
      ) {
        return NextResponse.json(
          { error: `Image dimensions must be at least ${MIN_DIMENSION}x${MIN_DIMENSION} pixels` },
          { status: 400 }
        );
      }
      if (
        dimensions.width > MAX_DIMENSION ||
        dimensions.height > MAX_DIMENSION
      ) {
        return NextResponse.json(
          { error: `Image dimensions must not exceed ${MAX_DIMENSION}x${MAX_DIMENSION} pixels` },
          { status: 400 }
        );
      }
    }

    // Generate unique filename with correct extension
    const ext = format ? getExtensionFromFormat(format) : ".png";
    const filename = `${crypto.randomUUID()}${ext}`;

    // Save via storage provider
    const storage = getStorageProvider();
    const url = await storage.save(filename, buffer, file.type);

    const response: Record<string, unknown> = { url };

    if (dimensions) {
      response.width = dimensions.width;
      response.height = dimensions.height;
    }

    response.size = buffer.length;

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
