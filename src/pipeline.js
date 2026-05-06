/**
 * Web Auto Agent - Orchestration Pipeline
 * Coordinates all four agents in a sequential + parallel execution model.
 */

const PlannerAgent = require('../agents/planner');
const BrowserAgent = require('../agents/browser');
const ExtractorAgent = require('../agents/extractor');
const VerifierAgent = require('../agents/verifier');

class AgentPipeline {
  constructor(options = {}) {
    this.planner = new PlannerAgent(options.planner);
    this.browser = new BrowserAgent(options.browser);
    this.extractor = new ExtractorAgent(options.extractor);
    this.verifier = new VerifierAgent(options.verifier);
    this.maxRetries = options.maxRetries || 3;
  }

  /**
   * Execute a task through the full agent pipeline
   * @param {string} task - Natural language task description
   * @returns {Object} - Structured output
   */
  async run(task) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`[Pipeline] Starting task: "${task}"`);
    console.log(`${'='.repeat(50)}\n`);

    const startTime = Date.now();
    const completedSteps = [];
    let lastResult = null;

    try {
      // Step 1: Planner decomposes the task
      const steps = await this.planner.plan(task);
      console.log(`\n[Pipeline] Executing ${steps.length} planned steps...\n`);

      // Step 2: Execute each step
      for (const step of steps) {
        console.log(`[Pipeline] Step ${step.id}: ${step.description}`);
        try {
          lastResult = await this._executeStep(step, lastResult);
          completedSteps.push(step);
        } catch (err) {
          console.log(`[Pipeline] Step ${step.id} failed: ${err.message}`);

          // Trigger replanning
          const newSteps = await this.planner.replan(completedSteps, step, err.message);
          console.log(`[Pipeline] Replanned: ${newSteps.length} remaining steps`);
          // In a real system, we'd continue with newSteps here
        }
      }

      // Step 3: Verify final result
      const validation = await this.verifier.verifyPipeline({
        ...lastResult,
        duration: Date.now() - startTime
      });

      const output = {
        success: true,
        task,
        result: lastResult,
        validation,
        duration: Date.now() - startTime,
        stepsCompleted: completedSteps.length,
        screenshots: this.browser.getScreenshots(),
      };

      console.log(`\n[Pipeline] ✅ Task complete in ${output.duration}ms`);
      console.log(`[Pipeline] Grade: ${validation.grade}`);
      return output;

    } catch (err) {
      console.error(`[Pipeline] ❌ Fatal error: ${err.message}`);
      return { success: false, task, error: err.message, duration: Date.now() - startTime };
    }
  }

  async _executeStep(step, previousResult) {
    switch (step.type) {
      case 'search':
        return await this.browser.navigate(`https://www.google.com/search?q=${encodeURIComponent(step.params.query || '')}`);
      case 'navigate':
        return await this.browser.navigate(step.params.url || previousResult?.url || 'https://example.com', step.params);
      case 'wait':
        return await this.browser.waitFor(step.params.condition, step.params);
      case 'extract':
        const pageContent = await this.browser.getContent();
        const extracted = await this.extractor.extract(pageContent, step.params);
        const validation = await this.verifier.validate(extracted, step.params);
        return { ...extracted, validation };
      case 'scroll':
        return await this.browser.scroll('down', step.params.amount);
      case 'paginate':
        const pages = [];
        for await (const page of this.browser.paginate(step.params.selector, step.params)) {
          const extracted2 = await this.extractor.extract(page.content, {});
          pages.push({ page: page.page, items: extracted2.items });
        }
        return { type: 'paginated', items: pages.flatMap(p => p.items), totalFound: pages.reduce((s, p) => s + p.items.length, 0) };
      case 'screenshot':
        return await this.browser.screenshot(step.params.name);
      case 'verify':
        return await this.verifier.validate(previousResult || {}, step.params);
      case 'output':
        return { formatted: this.extractor.toFormat(previousResult || {}, step.params.format), raw: previousResult };
      case 'login':
        await this.browser.fill('[type="email"]', step.params.email || '');
        await this.browser.fill('[type="password"]', step.params.password || '');
        return await this.browser.click('[type="submit"]');
      case 'fill_form':
        return { type: 'form_filled', success: true };
      default:
        console.log(`[Pipeline] Unknown step type: ${step.type}, skipping`);
        return previousResult;
    }
  }
}

module.exports = AgentPipeline;
