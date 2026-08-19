/** Heartbeat cadence: a peer sends `ping` this often. */
export const HEARTBEAT_INTERVAL_MS = 30_000
/** A peer that has not spoken for this long is dropped. */
export const HEARTBEAT_TIMEOUT_MS = 60_000
/** Pairing code is 6 decimal digits. */
export const PAIRING_CODE_LENGTH = 6
/** Pairing code lifetime; the issuing device rotates it after this. */
export const PAIRING_CODE_TTL_MS = 600_000
/** Wrong attempts before a pairing code is invalidated. */
export const PAIRING_MAX_ATTEMPTS = 5
/** Largest accepted wire text; mirrors the relay's 1 MiB maxPayload. */
export const MAX_MESSAGE_CHARS = 1_000_000
