import { snapshotFromData, snapshotToData, type StudioSnapshot } from './snapshot'

const MAX_LINK_DATA = 12_000
const MAX_JSON_BYTES = 32_768

function byteStream(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
}
async function readLimited(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const next = await reader.read()
      if (next.done) break
      length += next.value.byteLength
      if (length > MAX_JSON_BYTES) {
        await reader.cancel()
        throw new Error('This shared sound is too large.')
      }
      chunks.push(next.value)
    }
  } finally {
    reader.releaseLock()
  }
  const output = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }
  return output
}
function toBase64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
function fromBase64(value: string): Uint8Array {
  if (!value || value.length > MAX_LINK_DATA || !/^[A-Za-z0-9_-]+$/.test(value))
    throw new Error('Invalid shared sound link.')
  const padded =
    value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
}
export async function encodeSnapshot(snapshot: StudioSnapshot): Promise<string> {
  if (typeof CompressionStream === 'undefined')
    throw new Error('Sharing needs a browser with compression support. Please update your browser.')
  const bytes = new TextEncoder().encode(JSON.stringify(snapshotToData(snapshot)))
  if (bytes.length > MAX_JSON_BYTES) throw new Error('This sound is too large to share in a link.')
  const packed = await readLimited(byteStream(bytes).pipeThrough(new CompressionStream('deflate')))
  const encoded = toBase64(packed)
  if (encoded.length > MAX_LINK_DATA) throw new Error('This sound is too large to share in a link.')
  return 'v1.' + encoded
}
export async function decodeSnapshot(value: string): Promise<StudioSnapshot> {
  if (!value.startsWith('v1.'))
    throw new Error('This shared sound link uses an unsupported format.')
  if (typeof DecompressionStream === 'undefined')
    throw new Error('Opening shared sounds needs a browser with compression support.')
  try {
    const packed = fromBase64(value.slice(3))
    const bytes = await readLimited(
      byteStream(packed).pipeThrough(new DecompressionStream('deflate')),
    )
    return snapshotFromData(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)))
  } catch (error) {
    if (error instanceof Error && /snapshot version|too large|supported range/.test(error.message))
      throw error
    throw new Error('This shared sound link is damaged or contains unsupported settings.')
  }
}
