export interface BudeMemoryConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface StoreInput {
  userId: string;
  sessionId?: string;
  role?: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface RetrieveInput {
  userId: string;
  currentGoal?: string;
  maxTokens?: number;
  sessionId?: string;
  includeProfile?: boolean;
}

/**
 * JavaScript/TypeScript SDK for Bude Memory.
 */
export class BudeMemory {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: BudeMemoryConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000';
    this.apiKey = config.apiKey;
  }

  private async fetch(path: string, body?: unknown): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: body ? 'POST' : 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`BudeMemory error ${res.status}: ${err}`);
    }
    return res.json();
  }

  async store(input: StoreInput): Promise<{ success: boolean; id: string }> {
    return this.fetch('/store', input);
  }

  async retrieve(input: RetrieveInput): Promise<any> {
    return this.fetch('/retrieve', input);
  }

  async getProfile(userId: string): Promise<any> {
    return this.fetch(`/profile/${encodeURIComponent(userId)}`);
  }

  async getSessions(userId: string): Promise<any> {
    return this.fetch(`/sessions/${encodeURIComponent(userId)}`);
  }
}
