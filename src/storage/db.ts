import { Pool } from 'pg';
import { Message, MemoryTier, UserProfile } from '../core/types.js';

/**
 * PostgreSQL + pgvector storage layer.
 */
export class MemoryStore {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async init(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        metadata JSONB
      );

      CREATE TABLE IF NOT EXISTS memory_tiers (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        importance REAL DEFAULT 1.0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_accessed TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        facts TEXT[] DEFAULT '{}',
        preferences JSONB DEFAULT '{}',
        relationships JSONB DEFAULT '[]',
        summary TEXT DEFAULT '',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_messages_user_session 
        ON messages(user_id, session_id);
      CREATE INDEX IF NOT EXISTS idx_memory_user 
        ON memory_tiers(user_id);
    `);
  }

  async saveMessage(msg: Message): Promise<void> {
    await this.pool.query(
      `INSERT INTO messages (id, user_id, session_id, role, content, timestamp, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [msg.id, msg.userId, msg.sessionId, msg.role, msg.content, msg.timestamp, msg.metadata || {}]
    );
  }

  async getMessages(userId: string, sessionId?: string): Promise<Message[]> {
    const query = sessionId
      ? `SELECT * FROM messages WHERE user_id = $1 AND session_id = $2 ORDER BY timestamp`
      : `SELECT * FROM messages WHERE user_id = $1 ORDER BY timestamp`;
    const params = sessionId ? [userId, sessionId] : [userId];
    const result = await this.pool.query(query, params);
    return result.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      sessionId: r.session_id,
      role: r.role,
      content: r.content,
      timestamp: r.timestamp,
      metadata: r.metadata,
    }));
  }

  async saveTier(userId: string, tier: MemoryTier, sessionId?: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO memory_tiers (user_id, session_id, type, content, importance, created_at, last_accessed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, sessionId || null, tier.type, tier.content, tier.importance, tier.createdAt, tier.lastAccessed]
    );
  }

  async getTiers(userId: string, type?: string): Promise<MemoryTier[]> {
    const query = type
      ? `SELECT * FROM memory_tiers WHERE user_id = $1 AND type = $2 ORDER BY created_at DESC`
      : `SELECT * FROM memory_tiers WHERE user_id = $1 ORDER BY created_at DESC`;
    const params = type ? [userId, type] : [userId];
    const result = await this.pool.query(query, params);
    return result.rows.map((r) => ({
      type: r.type,
      content: r.content,
      importance: r.importance,
      createdAt: r.created_at,
      lastAccessed: r.last_accessed,
    }));
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_profiles (user_id, facts, preferences, relationships, summary, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         facts = EXCLUDED.facts,
         preferences = EXCLUDED.preferences,
         relationships = EXCLUDED.relationships,
         summary = EXCLUDED.summary,
         updated_at = EXCLUDED.updated_at`,
      [profile.userId, profile.facts, profile.preferences, profile.relationships, profile.summary, profile.updatedAt]
    );
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const result = await this.pool.query(
      `SELECT * FROM user_profiles WHERE user_id = $1`,
      [userId]
    );
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return {
      userId: r.user_id,
      facts: r.facts || [],
      preferences: r.preferences || {},
      relationships: r.relationships || [],
      summary: r.summary || '',
      updatedAt: r.updated_at,
    };
  }

  async getSessions(userId: string): Promise<Array<{ sessionId: string; messageCount: number; lastMessage: Date }>> {
    const result = await this.pool.query(
      `SELECT session_id, COUNT(*) as cnt, MAX(timestamp) as last_msg
       FROM messages WHERE user_id = $1 GROUP BY session_id ORDER BY last_msg DESC`,
      [userId]
    );
    return result.rows.map((r) => ({
      sessionId: r.session_id,
      messageCount: parseInt(r.cnt),
      lastMessage: r.last_msg,
    }));
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
