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

    return recent.map((msg) => ({
      type: 'working' as const,
      content: `[${msg.role}]: ${msg.content}`,
      importance: 1.0,
      createdAt: msg.timestamp,
      lastAccessed: new Date(),
    }));
  }

  compressEpisodic(entities: ExtractedEntity[]): MemoryTier[] {
    const events = entities.filter((e) => e.type === 'event' || e.confidence > 0.8);
    return events.map((e) => ({
      type: 'episodic' as const,
      content: e.value,
      importance: e.confidence,
      createdAt: new Date(),
      lastAccessed: new Date(),
    }));
  }

  updateSemantic(existing: UserProfile | null, entities: ExtractedEntity[]): UserProfile {
    const profile: UserProfile = existing || {
      userId: '',
      facts: [],
      preferences: {},
      relationships: [],
      summary: '',
      updatedAt: new Date(),
    };

    for (const e of entities) {
      if (e.type === 'fact' && !profile.facts.includes(e.value)) {
        profile.facts.push(e.value);
      }
      if (e.type === 'preference') {
        const [valence, ...rest] = e.value.split(': ');
        const key = rest.join(': ');
        profile.preferences[key] = valence;
      }
      if (e.type === 'relationship') {
        const exists = profile.relationships.some((r) => r.entity === e.value);
        if (!exists) {
          const [entity, relation] = e.value.split(' → ');
          profile.relationships.push({ entity, relation: relation || 'related' });
        }
      }
    }

    // Rebuild summary
    const prefEntries = Object.entries(profile.preferences)
      .map(([k, v]) => `${v} ${k}`)
      .join(', ');
    profile.summary = `Facts: ${profile.facts.join('; ')}. Preferences: ${prefEntries}.`;
    profile.updatedAt = new Date();

    return profile;
  }
}
