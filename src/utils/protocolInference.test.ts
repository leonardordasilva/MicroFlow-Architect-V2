import { describe, it, expect } from 'vitest';
import { inferProtocol } from './protocolInference';

describe('inferProtocol', () => {
  it('service → service deve retornar REST', () => {
    expect(inferProtocol('service', 'service')).toBe('REST');
  });

  it('service → database deve retornar TCP', () => {
    expect(inferProtocol('service', 'database')).toBe('TCP');
  });

  it('service → queue deve retornar AMQP', () => {
    expect(inferProtocol('service', 'queue')).toBe('AMQP');
  });

  it('queue → service deve retornar Kafka', () => {
    expect(inferProtocol('queue', 'service')).toBe('Kafka');
  });

  it('service → external deve retornar HTTPS', () => {
    expect(inferProtocol('service', 'external')).toBe('HTTPS');
  });

  it('external → service deve retornar REST', () => {
    expect(inferProtocol('external', 'service')).toBe('REST');
  });

  it('combinação desconhecida deve retornar REST como fallback', () => {
    expect(inferProtocol('external', 'database')).toBe('REST');
  });
});
