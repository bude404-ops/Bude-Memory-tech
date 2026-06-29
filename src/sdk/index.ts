import { BudeEngine } from '../core/engine.js';
import { MemoryStore } from '../storage/db.js';
import { Message, RetrieveOptions, UserProfile } from '../core/types.js';

export interface BudeMemoryConfig {
  baseUrl?: string;
  databaseUrl?: string;
}

/**
 * High-level SDK wrapper for Bude Memory.
 */
export class BudeMemory {
  private engine: BudeEngine;
  private store: MemoryStore;
  private initialized: boolean = false;

  constructor(config: BudeMemoryConfig = {}) {
    const dbUrl = config.databaseUrl || process.env.DATABASE_URL || 'postgresql://localhost:5432/budememory';
    this.store = new MemoryStore(dbUrl);
    this.engine = new BudeEngine(this.store);
  }

  async init(): Promise<void> {
    if (!this.initialized) {
      await this.store.init();
      this.initialized = true;
    }
  }

  async store(msg: Omit<Message, 'timestamp'> & { timestamp?: Date }): Promise<void> {
    await this.init();
    const fullMsg: Message = {
      ...msg,
      timestamp: msg.timestamp || new Date(),
    };
    await this.engine.storeMessage(fullMsg);
  }

  async retrieve(options: RetrieveOptions) {
    await this.init();
    return this.engine.retrieve(options);
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    await this.init();
    return this.engine.getProfile(userId);
  }

  async getSessions(userId: string) {
    await this.init();
    return this.engine.getSessions(userId);
  }

  async close(): Promise<void> {
    await this.store.close();
    this.initialized = false;
  }
}
