import { Message, RetrieveOptions, RetrievedContext, UserProfile } from './types.js';
import { EntityExtractor } from './extractor.js';
import { MemoryCompressor } from './compressor.js';
import { MemoryRetriever } from './retriever.js';
import { MemoryStore } from '../storage/db.js';

/**
 * Main engine: orchestrates extract → compress → store → retrieve.
 */
export class BudeEngine {
  private extractor: EntityExtractor;
  private compressor: MemoryCompressor;
  private retriever: MemoryRetriever;
  private store: MemoryStore;

  constructor(store: MemoryStore) {
    this.extractor = new EntityExtractor();
    this.compressor = new MemoryCompressor();
    this.retriever = new MemoryRetriever();
    this.store = store;
  }

  async storeMessage(msg: Message): Promise<void> {
    // 1. Save raw message
    await this.store.saveMessage(msg);

    // 2. Extract entities
    const entities = this.extractor.extract(msg);

    // 3. Compress into tiers
    const allMessages = await this.store.getMessages(msg.userId, msg.sessionId);
    const working = this.compressor.compressWorking(allMessages);
    const episodic = this.compressor.compressEpisodic(entities);

    // 4. Update semantic profile
    const existingProfile = await this.store.getProfile(msg.userId);
    const profile = this.compressor.updateSemantic(existingProfile, entities);
    profile.userId = msg.userId;

    // 5. Persist
    for (const tier of working) {
      await this.store.saveTier(msg.userId, tier, msg.sessionId);
    }
    for (const tier of episodic) {
      await this.store.saveTier(msg.userId, tier, msg.sessionId);
    }
    await this.store.saveProfile(profile);
  }

  async retrieve(options: RetrieveOptions): Promise<RetrievedContext> {
    const { userId, sessionId } = options;

    const allMessages = await this.store.getMessages(userId, sessionId);
    const working = this.compressor.compressWorking(allMessages);
    const allEpisodic = await this.store.getTiers(userId, 'episodic');
    const profile = await this.store.getProfile(userId);

    return this.retriever.retrieve(working, allEpisodic, profile, options);
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    return this.store.getProfile(userId);
  }

  async getSessions(userId: string) {
    return this.store.getSessions(userId);
  }
}
