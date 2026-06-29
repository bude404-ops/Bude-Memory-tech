import { MemoryTier, UserProfile, RetrieveOptions, RetrievedContext } from './types.js';

/**
 * Retrieves the smallest relevant context set based on options.
 */
export class MemoryRetriever {
  retrieve(
    working: MemoryTier[],
    episodic: MemoryTier[],
    profile: UserProfile | null,
    options: RetrieveOptions
  ): RetrievedContext {
    const maxTokens = options.maxTokens || 1000;
    const includeProfile = options.includeProfile !== false;

    // Simple token estimation: ~4 chars per token
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);

    let totalTokens = 0;
    const selectedWorking: MemoryTier[] = [];
    const selectedEpisodic: MemoryTier[] = [];

    // Always include working memory (most recent)
    for (const tier of working) {
      const tokens = estimateTokens(tier.content);
      if (totalTokens + tokens > maxTokens) break;
      selectedWorking.push(tier);
      totalTokens += tokens;
    }

    // Add episodic if space permits, sorted by importance
    const sortedEpisodic = [...episodic].sort((a, b) => b.importance - a.importance);
    for (const tier of sortedEpisodic) {
      const tokens = estimateTokens(tier.content);
      if (totalTokens + tokens > maxTokens) break;
      // Deduplicate
      if (!selectedEpisodic.some((e) => e.content === tier.content)) {
        selectedEpisodic.push(tier);
        totalTokens += tokens;
      }
    }

    return {
      working: selectedWorking,
      episodic: selectedEpisodic,
      semantic: includeProfile ? profile : null,
      estimatedTokens: totalTokens,
    };
  }
}
