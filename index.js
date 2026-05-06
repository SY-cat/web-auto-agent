/**
 * Web Auto Agent - Entry Point & CLI
 */

const AgentPipeline = require('./src/pipeline');

async function main() {
  const args = process.argv.slice(2);
  const taskIdx = args.indexOf('--task');
  const task = taskIdx !== -1 ? args[taskIdx + 1] : '从科技新闻网站提取今日头条新闻';

  const pipeline = new AgentPipeline({
    planner: { maxSteps: 20 },
    browser: { timeout: 15000 },
    extractor: { strategy: 'smart', format: 'json' },
    verifier: { minItems: 1, maxRetries: 3 }
  });

  const result = await pipeline.run(task);

  console.log('\n' + '='.repeat(50));
  console.log('FINAL RESULT:');
  console.log('='.repeat(50));
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
