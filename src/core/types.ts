export interface Message {
  id: string;
  userId: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface MemoryTier {
  type: 'working' | 'episodic' | 'semantic';
  content: string;
  importance: number;
  createdAt: Date;
  lastAccessed: Date;
}

export interface UserProfile {
  userId: string;
  facts: string[];
  preferences: Record<string, string>;
  relationships: Array<{ entity: string; relation: string }>;
  summary: string;
  updatedAt: Date;
}

export interface RetrieveOptions {
  userId: string;
  currentGoal?: string;
  maxTokens?: number;
  sessionId?: string;
  includeProfile?: boolean;
}

export interface RetrievedContext {
  working: MemoryTier[];
  episodic: MemoryTier[];
  semantic: UserProfile | null;
  estimatedTokens: number;
}

export interface ExtractedEntity {
  type: 'fact' | 'preference' | 'relationship' | 'event';
  value: string;
  confidence: number;
}
