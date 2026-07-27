import { describe, it, expect } from 'vitest';
import http from 'node:http';
import app from '../server.js';

describe('GET /api/health', () => {
  it('should return 200 with status ok', async () => {
    // Start the server on a random port for testing
    const server = http.createServer(app);

    await new Promise<void>((resolve, reject) => {
      server.listen(0, () => resolve());
      server.on('error', reject);
    });

    try {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        throw new Error('Could not get server address');
      }

      const response = await fetch(`http://127.0.0.1:${addr.port}/api/health`);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('redis');
      expect(['connected', 'unavailable']).toContain(body.redis);
      expect(body).toHaveProperty('timestamp');
    } finally {
      server.close();
    }
  });
});
