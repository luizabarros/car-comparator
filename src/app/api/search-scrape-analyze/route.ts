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
import { CarData } from '@/types/car'

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
    const carItems: string[] = await request.json();

    if (!Array.isArray(carItems) || carItems.length === 0) {
      return NextResponse.json({ error: 'Array of car items is required' }, { status: 400 });
    }

    const scraper = new AdvancedScraper();
    const allResults: Record<string, CarData> = {};

    await Promise.allSettled(
      carItems.map(async (item) => {
        const [carModel, yearStr] = item.split(',').map(s => s.trim());
        const year = Number(yearStr);

        if (!carModel) throw new Error(`Invalid car model in item: "${item}"`);

        const urls = await GoogleSearchAPI.searchCarSites(carModel, year);

        if (!urls || urls.length === 0) {
          return { carModel, year, results: [] as IResult[] };
        }

        const settledResults = await Promise.allSettled(
          urls.map(async (url) => {
            const scrapeResult = await scraper.scrapeWithProxyRotation(url.link, 3);
            const analysis = await LLMAnalyzer.analyzeCarContent(scrapeResult.anonymized, carModel);

            allResults[`${carModel},${year}`] = analysis;

            return {
              url: url.link,
              proxyUsed: scrapeResult.proxyUsed,
              analysis,
              imageUrl: url.imageUrl
            };
          })
        );

        const results: IResult[] = settledResults.map(res => {
          if (res.status === "fulfilled") return res.value;
          return { url: res.reason?.url ?? "unknown", error: res.reason instanceof Error ? res.reason.message : "Unknown error" };
        });

        return { carModel, year, results };
      })
    );

    await scraper.quit();

    const comparisonHTML = await LLMAnalyzer.compareCars(allResults);

    return NextResponse.json({ success: true, results: comparisonHTML });
  } catch (error) {
    console.error('Search-Scrape-Analyze error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
