import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Loads a file from `public/` when present (e.g. Sam visual pack drop-in).
 * Returns null when the asset has not been copied yet.
 */
export function loadPublicAsset(relativePath: string): Buffer | null {
  const filePath = path.join(process.cwd(), "public", relativePath);
  if (!existsSync(filePath)) {
    return null;
  }
  return readFileSync(filePath);
}

export function publicAssetExists(relativePath: string): boolean {
  return existsSync(path.join(process.cwd(), "public", relativePath));
}

/** Body suitable for `Response` static asset routes. */
export function loadPublicAssetBody(relativePath: string): BodyInit | null {
  const buffer = loadPublicAsset(relativePath);
  if (!buffer) return null;
  return new Blob([Uint8Array.from(buffer)]);
}
