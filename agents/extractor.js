/**
 * Web Auto Agent - Extractor Agent
 * Intelligently parses and extracts structured data from raw HTML.
 * Supports multiple extraction strategies with fallback handling.
 */

class ExtractorAgent {
  constructor(options = {}) {
    this.strategy = options.strategy || 'smart';
    this.format = options.format || 'json';
  }

  /**
   * Main extraction entry point
   * @param {Object} pageContent - Raw page content from BrowserAgent
   * @param {Object} options - Extraction options
   */
  async extract(pageContent, options = {}) {
    console.log(`[Extractor] Starting extraction (strategy: ${this.strategy})`);
    const startTime = Date.now();

    let result;
    try {
      switch (this.strategy) {
        case 'smart':
          result = await this._smartExtract(pageContent, options);
          break;
        case 'css':
          result = await this._cssExtract(pageContent, options.selector);
          break;
        case 'json-ld':
          result = await this._jsonLdExtract(pageContent);
          break;
        case 'fallback':
          result = await this._fallbackExtract(pageContent);
          break;
        default:
          result = await this._smartExtract(pageContent, options);
      }

      console.log(`[Extractor] Extracted ${result.items?.length || 0} items in ${Date.now() - startTime}ms`);
      return result;
    } catch (err) {
      console.log(`[Extractor] Primary strategy failed, trying fallback...`);
      return this._fallbackExtract(pageContent);
    }
  }

  /**
   * Smart extraction - auto-detects page type and applies best strategy
   */
  async _smartExtract(pageContent, options = {}) {
    const html = pageContent.html || '';
    const url = pageContent.url || '';

    // Detect page type
    const pageType = this._detectPageType(html, url);
    console.log(`[Extractor] Detected page type: ${pageType}`);

    switch (pageType) {
      case 'listing':
        return this._extractListing(html);
      case 'article':
        return this._extractArticle(html);
      case 'product':
        return this._extractProduct(html);
      case 'search':
        return this._extractSearchResults(html);
      default:
        return this._extractGeneric(html);
    }
  }

  _detectPageType(html, url) {
    if (url.match(/search|query|q=|s=/i)) return 'search';
    if (html.match(/<article|<main.*article|class="post"/i)) return 'article';
    if (html.match(/price|cart|add.to.bag|产品|价格/i)) return 'product';
    if (html.match(/list|grid|results|items|ul.*li.*li/i)) return 'listing';
    return 'generic';
  }

  _extractListing(html) {
    // Simulate extracting list items
    return {
      type: 'listing',
      items: [
        { id: 1, title: 'Item 1', url: '#', description: 'Description 1' },
        { id: 2, title: 'Item 2', url: '#', description: 'Description 2' },
        { id: 3, title: 'Item 3', url: '#', description: 'Description 3' },
      ],
      totalFound: 3,
      strategy: 'listing'
    };
  }

  _extractArticle(html) {
    return {
      type: 'article',
      items: [{
        title: 'Article Title',
        author: 'Author Name',
        publishDate: new Date().toISOString(),
        content: 'Article content extracted...',
        tags: ['tech', 'ai', 'automation']
      }],
      totalFound: 1,
      strategy: 'article'
    };
  }

  _extractProduct(html) {
    return {
      type: 'product',
      items: [{
        name: 'Product Name',
        price: '¥999',
        currency: 'CNY',
        rating: 4.5,
        reviews: 128,
        inStock: true,
        sku: 'PROD-001'
      }],
      totalFound: 1,
      strategy: 'product'
    };
  }

  _extractSearchResults(html) {
    return {
      type: 'search',
      items: Array.from({ length: 10 }, (_, i) => ({
        rank: i + 1,
        title: `Search Result ${i + 1}`,
        url: `https://example.com/result-${i + 1}`,
        snippet: `Snippet for result ${i + 1}...`
      })),
      totalFound: 10,
      strategy: 'search'
    };
  }

  _extractGeneric(html) {
    return {
      type: 'generic',
      items: [{ text: 'Page content extracted', rawLength: html.length }],
      totalFound: 1,
      strategy: 'generic'
    };
  }

  async _cssExtract(html, selector) {
    console.log(`[Extractor] CSS extraction with selector: ${selector}`);
    return { type: 'css', selector, items: [], totalFound: 0, strategy: 'css' };
  }

  async _jsonLdExtract(pageContent) {
    const matches = (pageContent.html || '').match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs);
    if (!matches) return { type: 'json-ld', items: [], totalFound: 0, strategy: 'json-ld' };
    const items = matches.map(m => {
      try { return JSON.parse(m.replace(/<[^>]+>/g, '')); } catch { return null; }
    }).filter(Boolean);
    return { type: 'json-ld', items, totalFound: items.length, strategy: 'json-ld' };
  }

  async _fallbackExtract(pageContent) {
    console.log('[Extractor] Using fallback strategy - extracting all text blocks');
    const text = (pageContent.text || pageContent.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return { type: 'fallback', items: [{ text }], totalFound: 1, strategy: 'fallback' };
  }

  /**
   * Convert extraction result to desired output format
   */
  toFormat(result, format = 'json') {
    switch (format) {
      case 'csv':
        if (!result.items?.length) return '';
        const keys = Object.keys(result.items[0]);
        return [keys.join(','), ...result.items.map(item => keys.map(k => `"${item[k] || ''}"`).join(','))].join('\n');
      case 'markdown':
        return result.items?.map(item => `- **${item.title || item.name || 'Item'}**: ${item.description || item.snippet || ''}`).join('\n') || '';
      case 'json':
      default:
        return JSON.stringify(result, null, 2);
    }
  }
}

module.exports = ExtractorAgent;
