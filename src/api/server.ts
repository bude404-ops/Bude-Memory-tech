import Fastify from 'fastify';
import cors from '@fastify/cors';
import { BudeEngine } from '../core/engine.js';
import { MemoryStore } from '../storage/db.js';
import { Message } from '../core/types.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: '*' });

const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/budememory';
const store = new MemoryStore(dbUrl);
await store.init();

const engine = new BudeEngine(store);

app.get('/health', async () => ({ status: 'ok', version: '0.1.0' }));

app.post('/store', async (request, reply) => {
  const body = request.body as any;
  const msg: Message = {
    id: body.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId: body.userId,
    sessionId: body.sessionId || 'default',
    role: body.role || 'user',
    content: body.content,
    timestamp: new Date(body.timestamp || Date.now()),
    metadata: body.metadata || {},
  };

  await engine.storeMessage(msg);
  return { success: true, id: msg.id };
});

app.post('/retrieve', async (request, reply) => {
  const body = request.body as any;
  const context = await engine.retrieve({
    userId: body.userId,
    currentGoal: body.currentGoal,
    maxTokens: body.maxTokens || 500,
    sessionId: body.sessionId,
    includeProfile: body.includeProfile !== false,
  });
  return context;
});

app.get('/profile/:userId', async (request, reply) => {
  const { userId } = request.params as any;
  const profile = await engine.getProfile(userId);
  if (!profile) return reply.status(404).send({ error: 'Profile not found' });
  return profile;
});

app.get('/sessions/:userId', async (request, reply) => {
  const { userId } = request.params as any;
  return engine.getSessions(userId);
});

const port = parseInt(process.env.PORT || '3000');
await app.listen({ port, host: '0.0.0.0' });
console.log(`Bude Memory API running on http://localhost:${port}`);
