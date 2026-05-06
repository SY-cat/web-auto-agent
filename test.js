/**
 * Web Auto Agent - Full Test Suite
 */

const PlannerAgent = require('./agents/planner');
const BrowserAgent = require('./agents/browser');
const ExtractorAgent = require('./agents/extractor');
const VerifierAgent = require('./agents/verifier');
const AgentPipeline = require('./src/pipeline');

let passed = 0, failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { console.log(`  ✓ ${name}`); passed++; })
    .catch(err => { console.log(`  ✗ ${name}: ${err.message}`); failed++; });
}

async function runTests() {
  console.log('=== Web Auto Agent Test Suite ===\n');

  // --- PlannerAgent Tests ---
  console.log('PlannerAgent:');
  const planner = new PlannerAgent();

  await test('decomposes extraction task', async () => {
    const steps = await planner.plan('extract all products from example.com');
    if (!Array.isArray(steps) || steps.length === 0) throw new Error('No steps generated');
  });

  await test('decomposes search task', async () => {
    const steps = await planner.plan('search for AI news today');
    if (!steps.find(s => s.type === 'search' || s.type === 'navigate')) throw new Error('No search step');
  });

  await test('generates replan on failure', async () => {
    const steps = await planner.plan('visit https://example.com');
    const failedStep = steps[0];
    const newSteps = await planner.replan([], failedStep, 'timeout');
    if (!Array.isArray(newSteps)) throw new Error('No replan generated');
  });

  // --- BrowserAgent Tests ---
  console.log('\nBrowserAgent:');
  const browser = new BrowserAgent();

  await test('navigates to URL', async () => {
    const r = await browser.navigate('https://example.com');
    if (!r.success) throw new Error('Navigation failed');
  });

  await test('records navigation history', async () => {
    await browser.navigate('https://test.com');
    if (browser.getHistory().length === 0) throw new Error('No history');
  });

  await test('takes screenshot', async () => {
    const r = await browser.screenshot('test');
    if (!r.filename) throw new Error('No filename');
  });

  await test('gets page content', async () => {
    const r = await browser.getContent();
    if (!r.html) throw new Error('No HTML returned');
  });

  // --- ExtractorAgent Tests ---
  console.log('\nExtractorAgent:');
  const extractor = new ExtractorAgent({ strategy: 'smart' });

  await test('smart extraction returns items array', async () => {
    const mockPage = { url: 'https://example.com', html: '<html><ul><li>a</li><li>b</li></ul></html>', text: 'a b' };
    const r = await extractor.extract(mockPage);
    if (!Array.isArray(r.items)) throw new Error('Items not array');
  });

  await test('detects product page', async () => {
    const mockPage = { url: 'https://shop.com/item', html: '<div class="price">¥999</div><button>add to cart</button>', text: '' };
    const r = await extractor.extract(mockPage);
    if (r.type !== 'product') throw new Error(`Expected product, got ${r.type}`);
  });

  await test('converts to CSV format', () => {
    const result = { items: [{ title: 'A', price: '100' }, { title: 'B', price: '200' }] };
    const csv = extractor.toFormat(result, 'csv');
    if (!csv.includes('title')) throw new Error('No header in CSV');
  });

  // --- VerifierAgent Tests ---
  console.log('\nVerifierAgent:');
  const verifier = new VerifierAgent({ minItems: 1 });

  await test('passes valid result', async () => {
    const r = await verifier.validate({ items: [{ id: 1 }] });
    if (!r.passed) throw new Error('Should pass');
  });

  await test('fails empty result', async () => {
    const r = await verifier.validate({});
    if (r.passed) throw new Error('Should fail on empty');
  });

  await test('fails when below min items', async () => {
    const strictVerifier = new VerifierAgent({ minItems: 5 });
    const r = await strictVerifier.validate({ items: [{ id: 1 }] });
    if (r.passed) throw new Error('Should fail min items check');
  });

  // --- Full Pipeline Test ---
  console.log('\nAgentPipeline (integration):');
  const pipeline = new AgentPipeline();

  await test('runs full pipeline successfully', async () => {
    const r = await pipeline.run('extract products from https://example.com/shop');
    if (!r.hasOwnProperty('success')) throw new Error('No success field');
  });

  await test('returns structured output', async () => {
    const r = await pipeline.run('get headlines from news site');
    if (typeof r.duration !== 'number') throw new Error('No duration field');
  });

  // Summary
  console.log(`\n${'='.repeat(35)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('🎉 All tests passed!');
  else console.log(`⚠️  ${failed} test(s) failed`);
}

runTests();
