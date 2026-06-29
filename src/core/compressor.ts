import { Message, MemoryTier, ExtractedEntity, UserProfile } from './types.js';

/**
 * Compress messages into memory tiers.
 * Working = last N messages raw.
 * Episodic = key events extracted.
 * Semantic = accumulated profile facts/preferences.
 */
export class MemoryCompressor {
  private workingWindowSize = 6;

  compressWorking(messages: Message[]): MemoryTier[] {
    const recent = messages
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, this.workingWindowSize)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return recent.map((m) => ({
      type: 'working' as const,
      content: `${m.role}: ${m.content}`,
      importance: 1.0,
      createdAt: m.timestamp,
      lastAccessed: new Date(),
    }));
  }

  compressEpisodic(entities: ExtractedEntity[]): MemoryTier[] {
    const events = entities.filter((e) => e.type === 'event');
    return events.map((e) => ({
      type: 'episodic' as const,
      content: e.value,
      importance: e.confidence,
      createdAt: new Date(),
      lastAccessed: new Date(),
    }));
  }

  updateSemantic(
    existing: UserProfile | null,
    entities: ExtractedEntity[]
  ): UserProfile {
    const facts = entities
      .filter((e) => e.type === 'fact')
      .map((e) => e.value);

    const prefs: Record<string, string> = {};
    entities
      .filter((e) => e.type === 'preference')
      .forEach((e) => {
        const key = e.value.split(' ').slice(0, 3).join('_');
        prefs[key] = e.value;
      });

    const relationships = entities
      .filter((e) => e.type === 'relationship')
      .map((e) => {
        const parts = e.value.split(' ');
        return { entity: parts[0] || 'unknown', relation: e.value };
      });

    if (!existing) {
      return {
        userId: '',
        facts,
        preferences: prefs,
        relationships,
        summary: facts.join('. ') || 'New user',
        updatedAt: new Date(),
      };
    }

    // Merge with existing
    const mergedFacts = [...new Set([...existing.facts, ...facts])];
    const mergedPrefs = { ...existing.preferences, ...prefs };
    const mergedRelations = [...existing.relationships, ...relationships];

    return {
      ...existing,
      facts: mergedFacts,
      preferences: mergedPrefs,
      relationships: mergedRelations,
      summary: mergedFacts.slice(0, 5).join('. ') || existing.summary,
      updatedAt: new Date(),
    };
  }
}
