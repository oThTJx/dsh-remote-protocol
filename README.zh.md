# @firefly0621/dsh-remote-protocol

[English](README.md) | 中文

远程控制能力的共享线协议：信封类型、消息校验与时序常量。零运行时依赖——中继服务器、host 插件与手机 PWA 都通过本包消费同一套词汇，因此消息形状绝不会在 peer 间漂移。

## 消息词汇

| 类型 | 方向 | 载荷 | 用途 |
|---|---|---|---|
| `hello` | 设备 → 中继 | `{ deviceSecret }` | 连接时的设备认证 |
| `pair` | App → 中继 | `{ pairingCode }` | App 为设备请求会话 |
| `pair-result` | 中继 → App | `{ token, deviceId, deviceName }` | 配对成功 |
| `pairing.issue` | 中继 → 设备 / 设备 → 中继 | `{ code, expiresAt }` | 中继请求配对码；设备应答 |
| `request` | App → 设备 | `{ token, method, params }` | 命令调用 |
| `response` | 设备 → App | `{ result }` | 命令结果 |
| `error` | 任意 | `{ code, message }` | 可恢复的失败 |
| `ping` / `pong` | 任意 | `{}` | 心跳 |
| `resume` | App → 中继 | `{ token }` | 用存储的 token 恢复会话，无需新配对码 |
| `sessions.list` | 设备 ↔ 中继 | 请求 `{}` / 响应 `{ sessions }` | 设备的已绑定 App 会话 |
| `sessions.revoke` | 设备 → 中继 | `{ sessionId }` | 丢弃一个 App 会话；手机需重新配对 |
| `event` | 设备 → 中继 → App | `{ event, payload }` | 向该设备绑定的每个 App 会话单向推送；承载聊天流事件（`chat/start` `{ sessionId }`、`chat/chunk` `{ text }`、`chat/done` `{ text }`、`chat/error` `{ code, message }`） |

`parseMessage(text)` 校验信封（JSON 形状、已知 `type`、存在 `payload`），输入畸形时抛出带稳定机器可读 `code` 的 `ProtocolError`。`serializeMessage(envelope)` 是其逆操作。

## 常量

- `HEARTBEAT_INTERVAL_MS = 30_000` —— 对端以此频率发送 `ping`。
- `HEARTBEAT_TIMEOUT_MS = 60_000` —— 静默的对端被断开。
- `PAIRING_CODE_LENGTH = 6`、`PAIRING_CODE_TTL_MS = 600_000`、`PAIRING_MAX_ATTEMPTS = 5` —— 配对码策略。

## 模型体验

无：本包是纯类型、校验与常量，没有任何内容到达模型请求。

#### KV Cache 影响

无：本包从不组装或发送 provider 请求。

## 已知限制与暂缓事项

- **载荷形状不按类型做 schema 校验** —— `parseMessage` 只检查信封外壳，不检查每个载荷的字段；peer 各自校验自己的载荷。当某个 consumer 需要线级校验且不想重复实现时，在这里添加按类型 schema。
