/**
 * Web Auto Agent - Verifier Agent
 * Validates extraction results and triggers self-healing replanning.
 * Implements quality gates and anomaly detection.
 */

class VerifierAgent {
  constructor(options = {}) {
    this.thresholds = {
      minItems: options.minItems || 1,
      minConfidence: options.minConfidence || 0.7,
      maxRetries: options.maxRetries || 3,
    };
    this.retryCount = 0;
    this.log = [];
  }

  /**
   * Validate extraction result against quality thresholds
   * @param {Object} result - Result from ExtractorAgent
   * @param {Object} options - Validation options
   * @returns {Object} - Validation report
   */
  async validate(result, options = {}) {
    const checks = [
      this._checkNotEmpty(result),
      this._checkDataIntegrity(result),
      this._checkMinItems(result, options.minItems),
      this._checkNoErrors(result),
    ];

    const allPassed = checks.every(c => c.passed);
    const confidence = checks.filter(c => c.passed).length / checks.length;

    const report = {
      passed: allPassed,
      confidence,
      checks,
      shouldRetry: !allPassed && this.retryCount < this.thresholds.maxRetries,
      retryCount: this.retryCount,
      timestamp: Date.now()
    };

    this.log.push(report);
    if (allPassed) {
      console.log(`[Verifier] ✓ Validation passed (confidence: ${(confidence * 100).toFixed(0)}%)`);
    } else {
      const failed = checks.filter(c => !c.passed).map(c => c.name);
      console.log(`[Verifier] ✗ Validation failed: ${failed.join(', ')}`);
      if (report.shouldRetry) {
        this.retryCount++;
        console.log(`[Verifier] Triggering retry ${this.retryCount}/${this.thresholds.maxRetries}`);
      }
    }

    return report;
  }

  /**
   * Verify the entire pipeline execution
   */
  async verifyPipeline(pipelineResult) {
    const checks = {
      hasResult: !!pipelineResult,
      hasItems: pipelineResult?.items?.length > 0,
      noDuplicates: this._noDuplicates(pipelineResult?.items || []),
      withinTimeLimit: (pipelineResult?.duration || 0) < 60000,
    };

    const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length;
    console.log(`[Verifier] Pipeline score: ${(score * 100).toFixed(0)}%`);
    return { score, checks, grade: score > 0.8 ? 'A' : score > 0.6 ? 'B' : 'C' };
  }

  _checkNotEmpty(result) {
    return {
      name: 'not_empty',
      passed: result && Object.keys(result).length > 0,
      message: 'Result must not be empty'
    };
  }

  _checkDataIntegrity(result) {
    const hasItems = Array.isArray(result?.items);
    return {
      name: 'data_integrity',
      passed: hasItems,
      message: 'Result must have items array'
    };
  }

  _checkMinItems(result, min) {
    const threshold = min || this.thresholds.minItems;
    const count = result?.items?.length || 0;
    return {
      name: 'min_items',
      passed: count >= threshold,
      message: `Must have at least ${threshold} items (got ${count})`
    };
  }

  _checkNoErrors(result) {
    return {
      name: 'no_errors',
      passed: !result?.error,
      message: result?.error ? `Error detected: ${result.error}` : 'No errors'
    };
  }

  _noDuplicates(items) {
    if (!items.length) return true;
    const key = items[0].url || items[0].id || items[0].title;
    if (!key) return true;
    const prop = items[0].url ? 'url' : items[0].id ? 'id' : 'title';
    const seen = new Set();
    return items.every(item => {
      const val = item[prop];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  }

  resetRetries() { this.retryCount = 0; }
  getLog() { return this.log; }
}

module.exports = VerifierAgent;
