import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BudeEngine } from '../src/core/engine.js';
import { MemoryStore } from '../src/storage/db.js';
import { Message } from '../src/core/types.js';

const TEST_DB = process.env.DATABASE_URL || 'postgresql://localhost:5432/budememory_test';

describe('BudeEngine', () => {
  let store: MemoryStore;
  let engine: BudeEngine;

  beforeAll(async () => {
    store = new MemoryStore(TEST_DB);
    await store.init();
    engine = new BudeEngine(store);
  });

  afterAll(async () => {
    await store.close();
  });

  it('stores and retrieves messages', async () => {
    const msg: Message = {
      id: 'test-1',
      userId: 'user_test',
      sessionId: 'sess_test',
      role: 'user',
      content: 'I love spicy food and my name is Alex.',
      timestamp: new Date(),
    };

    await engine.storeMessage(msg);

    const context = await engine.retrieve({
      userId: 'user_test',
      currentGoal: 'ordering food',
      maxTokens: 200,
    });

    expect(context.working.length).toBeGreaterThan(0);
    expect(context.estimatedTokens).toBeLessThanOrEqual(200);
  });

  it('builds a user profile', async () => {
    const profile = await engine.getProfile('user_test');
    expect(profile).not.toBeNull();
    expect(profile!.facts.length).toBeGreaterThan(0);
  });
});
