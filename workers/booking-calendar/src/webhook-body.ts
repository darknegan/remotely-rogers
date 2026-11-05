import { HttpError } from './bookingmood-client';

/**
 * Read request body as UTF-8 while enforcing a maximum byte length before buffering the full payload.
 */
export async function readRequestBodyUtf8(request: Request, maxBytes: number): Promise<string> {
  if (!request.body) {
    return '';
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        throw new HttpError(413, 'Webhook payload is too large.');
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(merged);
  } catch {
    throw new HttpError(400, 'Webhook body must be valid UTF-8.');
  }
}
