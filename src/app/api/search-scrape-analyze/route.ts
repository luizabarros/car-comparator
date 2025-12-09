export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
export const dynamicParams = true
export const fetchCache = 'force-no-store'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchAPI } from '../../../lib/google-search';
import { AdvancedScraper } from '../../../lib/advanced-scraper';
import { LLMAnalyzer } from '../../../lib/llm-analyzer';

interface IResult {
  url: string;
  analysis?: any;
  proxyUsed?: string;
  error?: string;
  imageUrl?: string;
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to run search + scrape + analyze' })
}

export async function POST(request: NextRequest) {
  try {
    const { carModel, year } = await request.json();

    if (!carModel) {
      return NextResponse.json({ error: 'Car model is required' }, { status: 400 });
    }

    const urls = await GoogleSearchAPI.searchCarSites(carModel, year);

    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: 'No URLs found for the given car model' }, { status: 404 });
    }

    const scraper = new AdvancedScraper();

    const settledResults = await Promise.allSettled(
      urls.map(async (url) => {
        const scrapeResult = await scraper.scrapeWithProxyRotation(url.link, 3);
        const analysis = await LLMAnalyzer.analyzeCarContent(scrapeResult.anonymized, carModel);

        return {
          url: url.link,
          proxyUsed: scrapeResult.proxyUsed,
          analysis,
          imageUrl: url.imageUrl
        };
      })
    );

    const results = settledResults.map(res => {
      if (res.status === "fulfilled") return res.value;
      return { url: res.reason?.url ?? "unknown", error: res.reason instanceof Error ? res.reason.message : "Unknown error" };
    });

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
