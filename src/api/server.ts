import http from 'http';
import { randomUUID } from 'node:crypto';
import { BudeMemory } from '../sdk/index.js';
import { Message } from '../core/types.js';

const PORT = process.env.PORT || 3000;
const memory = new BudeMemory();

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    if (path === '/health' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', service: 'bude-memory' }));
      return;
    }

    if (path === '/store' && req.method === 'POST') {
      const body = await readBody(req);
      const msg: Message = {
        id: body.id || randomUUID(),
        userId: body.userId,
        sessionId: body.sessionId,
        role: body.role,
        content: body.content,
        timestamp: new Date(body.timestamp || Date.now()),
        metadata: body.metadata || {},
      };
      await memory.store(msg);
      res.writeHead(201);
      res.end(JSON.stringify({ success: true, id: msg.id }));
      return;
    }

    if (path === '/retrieve' && req.method === 'POST') {
      const body = await readBody(req);
      const context = await memory.retrieve({
        userId: body.userId,
        sessionId: body.sessionId,
        currentGoal: body.currentGoal,
        maxTokens: body.maxTokens || 1000,
        includeProfile: body.includeProfile !== false,
      });
      res.writeHead(200);
      res.end(JSON.stringify(context));
      return;
    }

    if (path === '/profile' && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing userId' }));
        return;
      }
      const profile = await memory.getProfile(userId);
      res.writeHead(200);
      res.end(JSON.stringify(profile || { userId, facts: [], preferences: {}, relationships: [], summary: '' }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    console.error('API Error:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error', message: (err as Error).message }));
  }
});

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

server.listen(PORT, () => {
  console.log(`🧠 Bude Memory API running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET  /health          - Health check`);
  console.log(`  POST /store           - Store a message`);
  console.log(`  POST /retrieve        - Retrieve context`);
  console.log(`  GET  /profile?userId  - Get user profile`);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await memory.close();
  server.close(() => process.exit(0));
});
