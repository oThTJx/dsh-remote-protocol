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

  it('rejects a null, array, or non-object payload instead of crashing consumers', () => {
    expect(() => parseMessage(JSON.stringify({ type: 'hello', payload: null }))).toThrow(/payload must be a JSON object/)
    expect(() => parseMessage(JSON.stringify({ type: 'request', payload: [1, 2] }))).toThrow(/payload must be a JSON object/)
    expect(() => parseMessage(JSON.stringify({ type: 'event', payload: 'x' }))).toThrow(/payload must be a JSON object/)
  })

  it('rejects oversized messages before parsing them', () => {
    const huge = `{"type":"ping","payload":{}${' ,"pad":"x"'.repeat(200_000)}}`
    expect(huge.length).toBeGreaterThan(1_000_000)
    expect(() => parseMessage(huge)).toThrow(/too large/)
  })

  it('does not echo caller-controlled input in error messages', () => {
    expect(() => parseMessage(JSON.stringify({ type: '<script>alert(1)</script>', payload: {} })))
      .toThrow(/unknown message type/) // the payload string, not the type name
    expect(() => parseMessage(JSON.stringify({ type: 'event', payload: { event: '"><img onerror=1>' } })))
      .toThrow(/unknown event/)
  })

  it('accepts resume / sessions.list / sessions.revoke types', () => {
    expect(parseMessage(JSON.stringify({ type: 'resume', payload: { token: 't' } })).type).toBe('resume')
    expect(parseMessage(JSON.stringify({ type: 'sessions.list', payload: {} })).type).toBe('sessions.list')
    expect(parseMessage(JSON.stringify({ type: 'sessions.revoke', payload: { sessionId: 's' } })).type).toBe('sessions.revoke')
  })

  it('accepts known chat events and rejects unknown event names', () => {
    expect(parseMessage(JSON.stringify({ type: 'event', payload: { event: 'chat/chunk', payload: { text: 'hi' } } })).type).toBe('event')
    expect(() => parseMessage(JSON.stringify({ type: 'event', payload: { event: 'system.exec', payload: {} } })))
      .toThrow(/unknown event/)
    expect(() => parseMessage(JSON.stringify({ type: 'event', payload: { payload: {} } }))).toThrow(/unknown event/)
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
