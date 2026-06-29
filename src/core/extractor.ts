import { ExtractedEntity } from './types.js';

/**
 * Simple rule-based entity extractor.
 * In production, swap this for an LLM-based extractor.
 */
export class EntityExtractor {
  extract(msg: { content: string; role: string }): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const text = msg.content;

    // Extract preferences (hate/love/prefer)
    const prefPatterns = [
      { regex: /I (?:hate|dislike|can't stand|don't like)\s+([^,.]+)/gi, type: 'preference' as const, valence: 'negative' },
      { regex: /I (?:love|like|prefer|enjoy|want)\s+([^,.]+)/gi, type: 'preference' as const, valence: 'positive' },
      { regex: /I am (?:allergic to|intolerant to)\s+([^,.]+)/gi, type: 'preference' as const, valence: 'negative' },
    ];

    for (const p of prefPatterns) {
      let match;
      while ((match = p.regex.exec(text)) !== null) {
        entities.push({
          type: p.type,
          value: `${p.valence}: ${match[1].trim()}`,
          confidence: 0.8,
        });
      }
    }

    // Extract facts (name, location, job)
    const factPatterns = [
      { regex: /my name is (\w+)/gi, label: 'name' },
      { regex: /I am (?:a|an) ([^,.]+)/gi, label: 'occupation' },
      { regex: /I work (?:as|at|for) ([^,.]+)/gi, label: 'work' },
      { regex: /I live in ([^,.]+)/gi, label: 'location' },
    ];

    for (const p of factPatterns) {
      let match;
      while ((match = p.regex.exec(text)) !== null) {
        entities.push({
          type: 'fact',
          value: `${p.label}: ${match[1].trim()}`,
          confidence: 0.85,
        });
      }
    }

    // Extract relationships
    const relPattern = /my (\w+) (?:is|works as|lives in)\s+([^,.]+)/gi;
    let relMatch;
    while ((relMatch = relPattern.exec(text)) !== null) {
      entities.push({
        type: 'relationship',
        value: `${relMatch[1]} → ${relMatch[2].trim()}`,
        confidence: 0.75,
      });
    }

    // Extract events (booking, scheduling)
    const eventPatterns = [
      { regex: /book(?:ing|ed)?\s+(?:a|an)?\s*([^,.]+)/gi, label: 'booking' },
      { regex: /schedule(?:d|ing)?\s+(?:a|an)?\s*([^,.]+)/gi, label: 'scheduling' },
      { regex: /travel(?:ing|ling)?\s+(?:to)?\s*([^,.]+)/gi, label: 'travel' },
    ];

    for (const p of eventPatterns) {
      let match;
      while ((match = p.regex.exec(text)) !== null) {
        entities.push({
          type: 'event',
          value: `${p.label}: ${match[1].trim()}`,
          confidence: 0.7,
        });
      }
    }

    return entities;
  }
}
