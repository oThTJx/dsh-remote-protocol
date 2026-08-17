# @firefly0621/dsh-remote-protocol

Shared wire protocol for the remote-control capability: envelope types, message validation, and timing constants. Zero runtime dependencies — the relay server, the host plugin, and the mobile PWA all consume the same vocabulary through this package, so a message shape can never drift between peers.

## Message vocabulary

| Type | Direction | Payload | Purpose |
|---|---|---|---|
| `hello` | device → relay | `{ deviceSecret }` | Device authentication on connect |
| `pair` | app → relay | `{ pairingCode }` | App requests a session for a device |
| `pair-result` | relay → app | `{ token, deviceId, deviceName }` | Successful pairing |
| `pairing.issue` | relay → device / device → relay | `{ code, expiresAt }` | Relay asks for a code; device answers |
| `request` | app → device | `{ token, method, params }` | Command invocation |
| `response` | device → app | `{ result }` | Command result |
| `error` | any | `{ code, message }` | Recoverable failure |
| `ping` / `pong` | any | `{}` | Heartbeat |
| `resume` | app → relay | `{ token }` | Re-establish a session with a stored token, no new code |
| `sessions.list` | device ↔ relay | request `{}` / response `{ sessions }` | Bound app sessions of the device |
| `sessions.revoke` | device → relay | `{ sessionId }` | Drop one app session; the phone must pair again |

`parseMessage(text)` validates the envelope (JSON shape, known `type`, present `payload`) and throws `ProtocolError` with a stable machine-readable `code` on malformed input. `serializeMessage(envelope)` is the inverse.

## Constants

- `HEARTBEAT_INTERVAL_MS = 30_000` — peers send `ping` this often.
- `HEARTBEAT_TIMEOUT_MS = 60_000` — a silent peer is dropped.
- `PAIRING_CODE_LENGTH = 6`, `PAIRING_CODE_TTL_MS = 600_000`, `PAIRING_MAX_ATTEMPTS = 5` — pairing-code policy.

## Model Experience

None, as this package is pure types, validation, and constants; nothing here reaches a model request.

#### KV Cache effect

None; the package never assembles or sends a provider request.

## Known Limitations and Deferred Work

- **Payload shape is not schema-validated per type** — `parseMessage` checks the envelope shell, not each payload's fields; peers validate their own payloads. Add per-type schemas here when a consumer needs wire-level validation without duplicating it.
