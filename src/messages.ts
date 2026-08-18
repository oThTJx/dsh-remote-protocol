import type { Envelope, MessageType } from './types.ts'

/** Recoverable protocol failure; `code` is machine-readable and stable. */
export class ProtocolError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ProtocolError'
  }
}

const MESSAGE_TYPES = new Set<MessageType>([
  'hello', 'pair', 'pair-result', 'pairing.issue',
  'request', 'response', 'error', 'ping', 'pong',
  'resume', 'sessions.list', 'sessions.revoke',
  'event',
])

/** Parse one wire text into a validated envelope, rejecting malformed input. */
export function parseMessage(text: string): Envelope {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new ProtocolError('protocol.invalid', 'message is not valid JSON')
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new ProtocolError('protocol.invalid', 'message must be a JSON object')
  }
  const type = (raw as { type?: unknown }).type
  if (typeof type !== 'string' || !MESSAGE_TYPES.has(type as MessageType)) {
    throw new ProtocolError('protocol.invalid', `unknown message type: ${String(type)}`)
  }
  if (!('payload' in raw) || (raw as { payload?: unknown }).payload === undefined) {
    throw new ProtocolError('protocol.invalid', 'message is missing payload')
  }
  return raw as unknown as Envelope
}

/** Serialize one envelope to wire text. */
export function serializeMessage(message: Envelope): string {
  return JSON.stringify(message)
}
