/**
 * Example: Price Monitor Agent
 * Monitors product prices across e-commerce platforms
 */

const AgentPipeline = require('../src/pipeline');

async function runPriceMonitor() {
  console.log('💰 Price Monitor Agent Starting...\n');

  const pipeline = new AgentPipeline({
    extractor: { strategy: 'smart', format: 'json' },
    verifier: { minItems: 1 }
  });

  const products = [
    'extract price of iPhone 15 from jd.com',
    'get latest laptop prices from taobao search',
  ];

  const results = [];
  for (const task of products) {
    const result = await pipeline.run(task);
    if (result.success && result.result?.items?.length > 0) {
      results.push({ task, items: result.result.items });
      console.log(`✅ Found ${result.result.items.length} price(s)`);
    }
  }

  console.log('\n📊 Price Report:', JSON.stringify(results, null, 2));
}

runPriceMonitor().catch(console.error);
