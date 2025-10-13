import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchAPI } from '../../../lib/google-search';
import { AdvancedScraper } from '../../../lib/advanced-scraper';
import { LLMAnalyzer } from '../../../lib/llm-analyzer';

export async function POST(request: NextRequest) {
  try {
    const { carModel, year } = await request.json();

    if (!carModel) {
      return NextResponse.json({ error: 'Car model is required' }, { status: 400 });
    }

    // 1️⃣ SEARCH
    const urls = await GoogleSearchAPI.searchCarSites(carModel, year);

    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: 'No URLs found for the given car model' }, { status: 404 });
    }

    const scraper = new AdvancedScraper();
    const results: Array<{ url: string; analysis?: any; proxyUsed?: string; error?: string }> = [];

    // 2️⃣ SCRAPE + 3️⃣ ANALYZE
    for (const url of urls) {
      try {
        const scrapeResult = await scraper.scrapeWithProxyRotation(url.link, 3);

        const analysis = await LLMAnalyzer.analyzeCarContent(scrapeResult.anonymized, carModel);

        results.push({
          url: url.link,
          proxyUsed: scrapeResult.proxyUsed,
          analysis
        });
      } catch (err) {
        console.error(`Failed scraping/analyzing URL ${url}:`, err);
        results.push({ url: url.link, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    await scraper.quit();

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Search-Scrape-Analyze error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
