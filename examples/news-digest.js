/**
 * Example: News Digest Agent
 * Automatically collects and summarizes tech news headlines
 */

const AgentPipeline = require('../src/pipeline');

async function runNewsDigest() {
  console.log('📰 News Digest Agent Starting...\n');

  const pipeline = new AgentPipeline({
    extractor: { strategy: 'smart', format: 'markdown' },
    verifier: { minItems: 5 }
  });

  const sources = [
    'extract top 10 tech headlines from hacker news today',
    'get AI news from tech blogs this week',
  ];

  for (const task of sources) {
    const result = await pipeline.run(task);
    if (result.success) {
      console.log(`\n✅ Collected ${result.result?.totalFound || 0} headlines`);
    }
  }
}

runNewsDigest().catch(console.error);
