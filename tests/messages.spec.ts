import { describe, expect, it } from 'vitest'
import { parseMessage, ProtocolError, serializeMessage } from '../src/messages.ts'
import { PAIRING_CODE_LENGTH } from '../src/constants.ts'

describe('remote protocol messages', () => {
  it('round-trips a request envelope', () => {
    const envelope = {
      type: 'request',
      id: 'req-1',
      deviceId: 'my-pc',
      payload: { token: 't', method: 'plugin.list', params: {} },
    } as const
    expect(parseMessage(serializeMessage(envelope))).toEqual(envelope)
  })

  it('rejects non-JSON text', () => {
    expect(() => parseMessage('not json')).toThrow(ProtocolError)
  })

  it('rejects an unknown message type', () => {
    expect(() => parseMessage(JSON.stringify({ type: 'bogus', payload: {} }))).toThrow(/unknown message type/)
  })

  it('rejects a missing payload', () => {
    expect(() => parseMessage(JSON.stringify({ type: 'ping' }))).toThrow(/missing payload/)
  })

  it('accepts resume / sessions.list / sessions.revoke types', () => {
    expect(parseMessage(JSON.stringify({ type: 'resume', payload: { token: 't' } })).type).toBe('resume')
    expect(parseMessage(JSON.stringify({ type: 'sessions.list', payload: {} })).type).toBe('sessions.list')
    expect(parseMessage(JSON.stringify({ type: 'sessions.revoke', payload: { sessionId: 's' } })).type).toBe('sessions.revoke')
  })

  it('exposes a stable machine-readable error code', () => {
    try {
      parseMessage('nope')
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(ProtocolError)
      expect((error as ProtocolError).code).toBe('protocol.invalid')
    }
  })

  it('keeps the pairing code length constant at 6', () => {
    expect(PAIRING_CODE_LENGTH).toBe(6)
  })
})
