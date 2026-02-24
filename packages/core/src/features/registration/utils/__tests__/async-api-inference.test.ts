import { describe, it, expect } from 'vitest';
import { inferAllData } from '@/features/registration/utils/spec-inference';

describe('AsyncAPI Inference', () => {
  const asyncApiSpec = {
    asyncapi: '2.6.0',
    info: {
      title: 'Streetlights Kafka API',
      version: '1.0.0',
      description: 'The Smartylighting Streetlights API allows you to remotely manage the city lights.'
    },
    servers: {
      'scram-connections': {
        url: 'test.mykafkacluster.org:18092',
        protocol: 'kafka-secure',
        description: 'Test broker secured with scramSha256'
      }
    },
    channels: {
      'smartylighting.streetlights.1.0.event.{streetlightId}.lighting.measured': {
        description: 'The topic on which measured values may be produced and consumed.'
      }
    }
  };

  it('should infer metadata from AsyncAPI spec', () => {
    const inferred = inferAllData(asyncApiSpec);
    
    expect(inferred.name).toBe('Streetlights Kafka API');
    expect(inferred.version).toBe('1.0.0');
    expect(inferred.description).toContain('Smartylighting Streetlights API');
    expect(inferred.servers).toHaveLength(1);
    expect(inferred.servers[0].url).toBe('test.mykafkacluster.org:18092');
    expect(inferred.endpointCount).toBe(1);
    expect(inferred.primaryServerUrl).toBe('test.mykafkacluster.org:18092');
  });

  it('should infer auth from AsyncAPI spec', () => {
    const specWithAuth = {
      ...asyncApiSpec,
      components: {
        securitySchemes: {
          saslScram: {
            type: 'scramSha256',
            description: 'Provide your username and password'
          }
        }
      }
    };

    const inferred = inferAllData(specWithAuth);
    expect(inferred.auth).not.toBeNull();
    expect(inferred.auth?.type).toBe('scram-sha256');
  });
});
