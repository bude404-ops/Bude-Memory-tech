import { Message, ExtractedEntity } from './types.js';

/**
 * Extract structured entities from raw messages.
 * In production, this uses a small LLM. Here: rule-based MVP.
 */
export class EntityExtractor {
  extract(message: Message): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const text = message.content.toLowerCase();

    // Preference patterns
    const prefPatterns = [
      /i (?:like|love|prefer|enjoy|hate|dislike|can't stand) (.+?)(?:\.|,|$)/gi,
      /my favorite (.+?) is (.+?)(?:\.|,|$)/gi,
      /i always (.+?)(?:\.|,|$)/gi,
      /i never (.+?)(?:\.|,|$)/gi,
    ];

    for (const pattern of prefPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'preference',
          value: match[0].trim(),
          confidence: 0.7,
        });
      }
    }

    // Fact patterns
    const factPatterns = [
      /i am (?:a|an) (.+?)(?:\.|,|$)/gi,
      /i work (?:at|for|as) (.+?)(?:\.|,|$)/gi,
      /i live in (.+?)(?:\.|,|$)/gi,
      /my (?:name|email|phone) is (.+?)(?:\.|,|$)/gi,
    ];

    for (const pattern of factPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'fact',
          value: match[0].trim(),
          confidence: 0.8,
        });
      }
    }

    // Event patterns
    const eventPatterns = [
      /i (?:booked|bought|ordered|scheduled|planned) (.+?)(?:\.|,|$)/gi,
      /i (?:visited|went to|attended) (.+?)(?:\.|,|$)/gi,
      /i (?:finished|completed|started) (.+?)(?:\.|,|$)/gi,
    ];

    for (const pattern of eventPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'event',
          value: match[0].trim(),
          confidence: 0.75,
        });
      }
    }

    return entities;
  }
}
