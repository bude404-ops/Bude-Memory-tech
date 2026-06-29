import { BudeMemory } from 'bude-memory';

const memory = new BudeMemory({
  baseUrl: 'http://localhost:3000',
});

async function demo() {
  const userId = 'demo_user_001';
  const sessionId = 'session_001';

  await memory.store({
    userId,
    sessionId,
    role: 'user',
    content: 'Hi, I need to book a flight to Tokyo. I hate layovers and prefer window seats.',
  });

  await memory.store({
    userId,
    sessionId,
    role: 'assistant',
    content: 'I can help with that. When are you looking to travel?',
  });

  await memory.store({
    userId,
    sessionId,
    role: 'user',
    content: 'Next Tuesday. Also I am allergic to peanuts so no snacks with nuts.',
  });

  const context = await memory.retrieve({
    userId,
    sessionId,
    currentGoal: 'booking a flight to Tokyo',
    maxTokens: 300,
  });

  console.log('=== RETRIEVED CONTEXT ===');
  console.log('Working (recent turns):', context.working.length);
  console.log('Episodic (key events):', context.episodic.length);
  console.log('Semantic (user profile):', context.semantic ? 'yes' : 'no');
  console.log('Estimated tokens:', context.estimatedTokens);
  console.log('Profile:', JSON.stringify(context.semantic, null, 2));

  const profile = await memory.getProfile(userId);
  console.log('\n=== FULL PROFILE ===');
  console.log(JSON.stringify(profile, null, 2));
}

demo().catch(console.error);
