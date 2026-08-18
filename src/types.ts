/** One remote-control wire message. The `type` discriminant is the protocol's switch key. */
export type MessageType =
  | 'hello' | 'pair' | 'pair-result' | 'pairing.issue'
  | 'request' | 'response' | 'error' | 'ping' | 'pong'
  | 'resume' | 'sessions.list' | 'sessions.revoke'
  | 'event'

/** Public wire envelope: every message carries a type and a payload. */
export interface Envelope<T extends object = object> {
  type: MessageType
  /** Request/response correlation id; present on `request` and echoed on `response`. */
  id?: string
  /** Target device for a `request`; present on `hello` and `pair-result`. */
  deviceId?: string
  payload: T
}

export interface HelloPayload { deviceSecret: string }
export interface PairPayload { pairingCode: string }
export interface PairResultPayload { token: string; deviceId: string; deviceName: string }
export interface PairingIssuePayload { code: string; expiresAt: number }
export interface RequestPayload { token: string; method: string; params: unknown }
export interface ResponsePayload { result: unknown }
export interface ErrorPayload { code: string; message: string }
export type PingPayload = Record<string, never>
export type PongPayload = Record<string, never>

/** App → relay: re-establish a previously paired session with its stored token. */
export interface ResumePayload { token: string }
/** One bound app session as surfaced to the owning device. */
export interface SessionInfo { sessionId: string; deviceName: string; createdAt: number }
/** Device ↔ relay: `sessions.list` — request carries no fields, response carries `sessions`. */
export interface SessionsListPayload { sessions?: SessionInfo[] }
/** Device → relay: revoke one app session; relay echoes with `revoked`. */
export interface SessionsRevokePayload { sessionId: string; revoked?: boolean }

/** Device → relay → app: one asynchronous push (e.g. chat stream events). */
export interface EventPayload { event: string; payload: unknown }

/** Chat stream event names pushed from the device to a bound app. */
export type ChatEventName = 'chat/start' | 'chat/chunk' | 'chat/done' | 'chat/error'
/** `chat/start`: the agent accepted the message and began generating. */
export interface ChatStartPayload { sessionId: string }
/** `chat/chunk`: one text delta of the assistant reply. */
export interface ChatChunkPayload { text: string }
/** `chat/done`: the complete assistant reply text. */
export interface ChatDonePayload { text: string }
/** `chat/error`: the turn failed; `code` is machine-readable. */
export interface ChatErrorPayload { code: string; message: string }
