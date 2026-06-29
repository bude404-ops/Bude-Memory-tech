import { MemoryTier, UserProfile, RetrieveOptions, RetrievedContext } from './types.js';

/**
 * Retrieve the smallest relevant memory set for the current goal.
 * Ranks by relevance, not recency or similarity alone.
 */
export class MemoryRetriever {
  retrieve(
    working: MemoryTier[],
    episodic: MemoryTier[],
    semantic: UserProfile | null,
    options: RetrieveOptions
  ): RetrievedContext {
    const { currentGoal, maxTokens = 500, includeProfile = true } = options;

    // Score episodic memories against current goal
    const scoredEpisodic = episodic.map((e) => ({
      ...e,
      relevance: this.scoreRelevance(e.content, currentGoal || ''),
    }));

    // Sort by relevance * importance
    scoredEpisodic.sort(
      (a, b) => b.relevance * b.importance - a.relevance * a.importance
    );

    // Budget tokens across tiers
    const workingTokens = this.estimateTokens(working);
    const profileTokens = includeProfile && semantic ? this.estimateProfileTokens(semantic) : 0;
    const remainingBudget = Math.max(0, maxTokens - workingTokens - profileTokens);

    const selectedEpisodic: MemoryTier[] = [];
    let usedTokens = 0;
    for (const mem of scoredEpisodic) {
      const t = this.estimateTokens([mem]);
      if (usedTokens + t > remainingBudget) break;
      selectedEpisodic.push(mem);
      usedTokens += t;
    }

    const totalTokens = workingTokens + usedTokens + profileTokens;

    return {
      working,
      episodic: selectedEpisodic,
      semantic: includeProfile ? semantic : null,
      estimatedTokens: totalTokens,
    };
  }

  private scoreRelevance(content: string, goal: string): number {
    if (!goal) return 0.5;
    const cWords = new Set(content.toLowerCase().split(/\s+/));
    const gWords = new Set(goal.toLowerCase().split(/\s+/));
    const overlap = [...cWords].filter((w) => gWords.has(w)).length;
    return Math.min(1, overlap / Math.max(1, gWords.size));
  }

  private estimateTokens(tiers: MemoryTier[]): number {
    return tiers.reduce((sum, t) => sum + Math.ceil(t.content.length / 4), 0);
  }

  private estimateProfileTokens(profile: UserProfile): number {
    const text = `${profile.summary} ${Object.values(profile.preferences).join(' ')}`;
    return Math.ceil(text.length / 4);
  }
}
