/**
 * Web Auto Agent - Browser Agent
 * Handles all browser-level interactions: navigation, clicking,
 * form filling, screenshots, and page state management.
 */

class BrowserAgent {
  constructor(options = {}) {
    this.timeout = options.timeout || 15000;
    this.userAgent = options.userAgent || 'Mozilla/5.0 (compatible; WebAutoAgent/1.0)';
    this.currentUrl = null;
    this.history = [];
    this.screenshots = [];
  }

  /**
   * Navigate to a URL
   * @param {string} url
   * @param {Object} options
   */
  async navigate(url, options = {}) {
    console.log(`[Browser] Navigating to: ${url}`);
    const startTime = Date.now();

    // Simulate navigation (replace with Playwright/Puppeteer in real usage)
    await this._delay(options.timeout || 500);

    this.currentUrl = url;
    this.history.push({ url, timestamp: Date.now(), duration: Date.now() - startTime });

    console.log(`[Browser] Page loaded (${Date.now() - startTime}ms)`);
    return { success: true, url, title: 'Page Title' };
  }

  /**
   * Click an element by selector or text
   */
  async click(selector, options = {}) {
    console.log(`[Browser] Clicking: ${selector}`);
    await this._delay(200);
    return { success: true, selector, timestamp: Date.now() };
  }

  /**
   * Fill an input field
   */
  async fill(selector, value, options = {}) {
    console.log(`[Browser] Filling "${selector}" with value`);
    await this._delay(100);
    return { success: true, selector, length: value.length };
  }

  /**
   * Extract page HTML/text content
   */
  async getContent(options = {}) {
    console.log(`[Browser] Getting page content from: ${this.currentUrl}`);
    await this._delay(300);

    // Return mock page structure for demonstration
    return {
      url: this.currentUrl,
      title: 'Sample Page',
      html: '<html><body><div class="content">Sample content</div></body></html>',
      text: 'Sample content',
      timestamp: Date.now()
    };
  }

  /**
   * Scroll page (for lazy-loaded content or pagination)
   */
  async scroll(direction = 'down', amount = 500) {
    console.log(`[Browser] Scrolling ${direction} by ${amount}px`);
    await this._delay(150);
    return { success: true, direction, amount };
  }

  /**
   * Take a screenshot
   */
  async screenshot(name = '') {
    const filename = `screenshot_${Date.now()}_${name || 'page'}.png`;
    console.log(`[Browser] Taking screenshot: ${filename}`);
    this.screenshots.push({ filename, url: this.currentUrl, timestamp: Date.now() });
    return { filename, url: this.currentUrl };
  }

  /**
   * Wait for a condition
   */
  async waitFor(condition, options = {}) {
    const timeout = options.timeout || this.timeout;
    console.log(`[Browser] Waiting for: ${condition} (timeout: ${timeout}ms)`);
    await this._delay(Math.min(500, timeout));
    return { success: true, condition };
  }

  /**
   * Handle pagination — click "next" until done
   */
  async *paginate(nextButtonSelector = '[aria-label="next"]', options = {}) {
    const maxPages = options.maxPages || 10;
    let page = 1;

    while (page <= maxPages) {
      const content = await this.getContent();
      yield { page, content };

      const hasNext = page < maxPages; // simplified check
      if (!hasNext) break;

      await this.click(nextButtonSelector);
      await this.waitFor('networkIdle');
      page++;
    }

    console.log(`[Browser] Pagination complete: ${page} pages processed`);
  }

  getCurrentUrl() { return this.currentUrl; }
  getHistory() { return this.history; }
  getScreenshots() { return this.screenshots; }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = BrowserAgent;
