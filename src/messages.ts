import type { Envelope, MessageType, ChatEventName } from './types.ts'
import { MAX_MESSAGE_CHARS } from './constants.ts'

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

/** One canonical copy of the vocabulary; the sets and union derive from it. */
const ALL_TYPES = [
  'hello', 'pair', 'pair-result', 'pairing.issue',
  'request', 'response', 'error', 'ping', 'pong',
  'resume', 'sessions.list', 'sessions.revoke',
  'event',
] as const

const ALL_EVENT_NAMES = ['chat/start', 'chat/chunk', 'chat/done', 'chat/error'] as const

type AssertAll<T extends readonly unknown[], U> = [Exclude<U, T[number]>] extends [never] ? true : never

/**
 * Compile-time vocabulary guards: `true` fails to satisfy when a union member
 * is missing from its array, so adding a MessageType/ChatEventName without
 * listing it here breaks the build.
 */
export const _vocabularyCovered = {
  messageTypes: true satisfies AssertAll<typeof ALL_TYPES, MessageType>,
  eventNames: true satisfies AssertAll<typeof ALL_EVENT_NAMES, ChatEventName>,
} as const

const MESSAGE_TYPES = new Set<string>(ALL_TYPES)
const EVENT_NAMES = new Set<string>(ALL_EVENT_NAMES)

/** Parse one wire text into a validated envelope, rejecting malformed input. */
export function parseMessage(text: string): Envelope {
  if (text.length > MAX_MESSAGE_CHARS) {
    throw new ProtocolError('protocol.invalid', 'message is too large')
  }
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
  if (typeof type !== 'string' || !MESSAGE_TYPES.has(type)) {
    throw new ProtocolError('protocol.invalid', 'unknown message type')
  }
  const payload = (raw as { payload?: unknown }).payload
  // A bare-object payload is the one invariant every dispatch branch relies
  // on; rejecting null/arrays here keeps every consumer crash-free.
  if (payload === undefined) {
    throw new ProtocolError('protocol.invalid', 'message is missing payload')
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new ProtocolError('protocol.invalid', 'payload must be a JSON object')
  }
  // The event vocabulary is a closed set: reject unknown push names at the
  // wire boundary so peers cannot smuggle arbitrary event strings through.
  if (type === 'event') {
    const event = (payload as { event?: unknown }).event
    if (typeof event !== 'string' || !EVENT_NAMES.has(event)) {
      throw new ProtocolError('protocol.invalid', 'unknown event')
    }
  }
  return raw as unknown as Envelope
}

/** Serialize one envelope to wire text. */
export function serializeMessage(message: Envelope): string {
  return JSON.stringify(message)
}

export { ALL_TYPES, ALL_EVENT_NAMES }
