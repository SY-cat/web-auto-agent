/**
 * Web Auto Agent - Planner Agent
 * Decomposes high-level tasks into executable step sequences
 * using long-chain reasoning.
 */

class PlannerAgent {
  constructor(options = {}) {
    this.maxSteps = options.maxSteps || 20;
    this.model = options.model || 'mimo-v2.5';
    this.memory = [];
  }

  /**
   * Decompose a natural language task into atomic steps
   * @param {string} task - High-level task description
   * @returns {Array} - Ordered list of executable steps
   */
  async plan(task) {
    console.log(`[Planner] Analyzing task: "${task}"`);

    const steps = this._decompose(task);
    this.memory.push({ task, steps, timestamp: Date.now() });

    console.log(`[Planner] Generated ${steps.length} steps`);
    return steps;
  }

  /**
   * Replan after a step failure - self-healing capability
   * @param {Array} completedSteps - Steps already executed
   * @param {Object} failedStep - The step that failed
   * @param {string} errorMsg - Error details
   * @returns {Array} - New plan from current state
   */
  async replan(completedSteps, failedStep, errorMsg) {
    console.log(`[Planner] Replanning after failure at step: ${failedStep.id}`);
    console.log(`[Planner] Error: ${errorMsg}`);

    // Generate alternative approach
    const alternative = this._generateAlternative(failedStep, errorMsg);
    const remainingSteps = this._getRemaining(completedSteps, failedStep);

    return [alternative, ...remainingSteps];
  }

  _decompose(task) {
    const taskLower = task.toLowerCase();
    const steps = [];
    let id = 1;

    // Navigation step
    if (taskLower.match(/go to|visit|open|navigate|打开|访问/)) {
      const urlMatch = task.match(/https?:\/\/[^\s]+/);
      steps.push({
        id: id++, type: 'navigate',
        description: `Navigate to target URL`,
        params: { url: urlMatch ? urlMatch[0] : 'https://example.com' }
      });
    } else {
      steps.push({
        id: id++, type: 'search',
        description: `Search for relevant page`,
        params: { query: task }
      });
      steps.push({
        id: id++, type: 'navigate',
        description: `Navigate to best matching result`,
        params: {}
      });
    }

    // Login step
    if (taskLower.match(/login|sign in|logged in|登录/)) {
      steps.push({
        id: id++, type: 'login',
        description: 'Handle authentication',
        params: { waitForSelector: '[type="submit"]' }
      });
    }

    // Wait for page load
    steps.push({
      id: id++, type: 'wait',
      description: 'Wait for page to fully load',
      params: { condition: 'networkIdle', timeout: 10000 }
    });

    // Extraction step
    if (taskLower.match(/extract|collect|get|fetch|scrape|获取|提取|抓取/)) {
      steps.push({
        id: id++, type: 'extract',
        description: 'Extract target content from page',
        params: { strategy: 'smart', format: 'json' }
      });
    }

    // Form fill step
    if (taskLower.match(/fill|submit|form|input|填写|提交/)) {
      steps.push({
        id: id++, type: 'fill_form',
        description: 'Fill and submit form',
        params: {}
      });
    }

    // Scroll & paginate
    if (taskLower.match(/all|every|全部|所有|翻页/)) {
      steps.push({
        id: id++, type: 'paginate',
        description: 'Handle pagination to collect all results',
        params: { maxPages: 10 }
      });
    }

    // Verify
    steps.push({
      id: id++, type: 'verify',
      description: 'Validate extracted data quality',
      params: { minItems: 1 }
    });

    // Output
    steps.push({
      id: id++, type: 'output',
      description: 'Format and return structured results',
      params: { format: 'json' }
    });

    return steps;
  }

  _generateAlternative(failedStep, errorMsg) {
    const fallbacks = {
      navigate: { type: 'navigate', description: 'Retry navigation with longer timeout', params: { timeout: 30000 } },
      extract: { type: 'extract', description: 'Fallback extraction with broader selectors', params: { strategy: 'fallback' } },
      login: { type: 'wait_manual', description: 'Wait for manual login intervention', params: { timeout: 60000 } },
    };
    return fallbacks[failedStep.type] || { type: 'skip', description: `Skip failed step: ${failedStep.id}`, params: {} };
  }

  _getRemaining(completed, failed) {
    const ids = new Set(completed.map(s => s.id));
    ids.add(failed.id);
    return this.memory[this.memory.length - 1].steps.filter(s => !ids.has(s.id));
  }

  getMemory() { return this.memory; }
  clearMemory() { this.memory = []; }
}

module.exports = PlannerAgent;
