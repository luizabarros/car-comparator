export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
export const dynamicParams = true
export const fetchCache = 'force-no-store'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server';
import { LLMAnalyzer } from '../../../lib/llm-analyzer';
import { AnalyzedCar, CarData, CarItem, ProcessedURLs, SearchResult } from '@/types/car'
import { SearchAPI } from '@/lib/search'

const ANALYSIS_TIMEOUT = 60000; // 60 segundos por veículo
const TOTAL_REQUEST_TIMEOUT = 180000; // 3 minutos total

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

class ParseFilter {
  async process(carItems: string[]): Promise<CarItem[]> {
    return carItems.map((item) => {
      const [carModel, yearStr] = item.split(',').map(s => s.trim());
      const year = yearStr ? Number(yearStr) : undefined;

      if (!carModel) {
        throw new Error(`Invalid car model in item: "${item}"`);
      }

      return { carModel, year, originalInput: item };
    });
  }
}

class SearchFilter {
  async process(carItems: CarItem[]): Promise<SearchResult[]> {
    const results = await Promise.allSettled(
      carItems.map(async (item) => {
        console.log(`🔍 Buscando URLs para: ${item.carModel} ${item.year || ''}`);
        
        const searchResults = await withTimeout(
          SearchAPI.searchCarSites(item.carModel, item.year),
          30000,
          `Search timeout for ${item.carModel}`
        );

        if (!searchResults || searchResults.length === 0) {
          console.warn(`⚠️ Nenhuma URL encontrada para: ${item.carModel}`);
          throw new Error('No search results found');
        }

        console.log(`✅ Encontradas ${searchResults.length} URLs para ${item.carModel}`);

        return {
          ...item,
          searchResults
        };
      })
    );

    return results
      .filter((r): r is PromiseFulfilledResult<SearchResult> => r.status === 'fulfilled')
      .map(r => r.value);
  }
}

class URLProcessingFilter {
  async process(searchResults: SearchResult[]): Promise<ProcessedURLs[]> {
    return searchResults.map((result) => {
      const organicUrls = result.searchResults
        .filter(r => r.type === 'organic' && r.link)
        .map(r => r.link)
        .slice(0, 10);

      const reclameAquiResults = result.searchResults.filter(r => 
        r.type === 'organic' && 
        r.link && 
        r.link.includes('reclameaqui.com.br')
      );

      const imageResults = result.searchResults.filter(r => r.type === 'image');

      const dealershipResults = result.searchResults.filter(r => r.type === 'local');

      return {
        carModel: result.carModel,
        year: result.year,
        originalInput: result.originalInput,
        organicUrls,
        reclameAquiResults,
        imageResults,
        dealershipResults,
        allSearchResults: result.searchResults
      };
    });
  }
}

class LLMExtractionFilter {
  async process(processedURLs: ProcessedURLs[]): Promise<AnalyzedCar[]> {
    const results = await Promise.allSettled(
      processedURLs.map(async (item) => {
        console.log(`🤖 Extraindo dados via LLM para: ${item.carModel}`);
        
        const carData = await withTimeout(
          LLMAnalyzer.extractCarDataFromURLs(
            item.organicUrls,
            item.carModel,
            item.year,
            {
              organic: item.allSearchResults.filter(r => r.type === 'organic'),
              reclameaqui: item.reclameAquiResults,
              images: item.imageResults,
              dealerships: item.dealershipResults
            }
          ),
          ANALYSIS_TIMEOUT,
          `LLM analysis timeout for ${item.carModel}`
        );

        console.log(`✅ Dados extraídos com sucesso: ${item.carModel}`);

        return {
          carModel: item.carModel,
          year: item.year,
          originalInput: item.originalInput,
          data: carData
        };
      })
    );

    return results.map((r, index) => {
      if (r.status === 'fulfilled') {
        return r.value;
      } else {
        const item = processedURLs[index];
        return {
          carModel: item.carModel,
          year: item.year,
          originalInput: item.originalInput,
          data: null,
          error: r.reason.message
        };
      }
    });
  }
}

class ComparisonFilter {
  async process(analyzedCars: AnalyzedCar[]): Promise<string> {
    const allCarsData: Record<string, CarData> = {};

    analyzedCars.forEach((car) => {
      if (car.data) {
        const key = car.year ? `${car.carModel},${car.year}` : car.carModel;
        allCarsData[key] = car.data;
      }
    });

    if (Object.keys(allCarsData).length === 0) {
      throw new Error('No car data available for comparison');
    }

    console.log(`📊 Gerando comparativo HTML...`);
    
    const comparisonHTML = await withTimeout(
      LLMAnalyzer.generateComparisonHTML(allCarsData),
      30000,
      'Comparison HTML generation timeout'
    );

    console.log(`✅ Comparativo gerado com sucesso!`);

    return comparisonHTML;
  }
}

class CarAnalysisPipeline {
  private parseFilter = new ParseFilter();
  private searchFilter = new SearchFilter();
  private urlProcessingFilter = new URLProcessingFilter();
  private llmExtractionFilter = new LLMExtractionFilter();
  private comparisonFilter = new ComparisonFilter();

  async execute(carItems: string[]) {
    console.log(`🚗 Iniciando análise de ${carItems.length} veículo(s)...`);

    // Pipeline: Parse → Search → Process URLs → Extract with LLM → Generate Comparison
    const parsedItems = await this.parseFilter.process(carItems);
    const searchResults = await this.searchFilter.process(parsedItems);
    const processedURLs = await this.urlProcessingFilter.process(searchResults);
    const analyzedCars = await this.llmExtractionFilter.process(processedURLs);
    
    const successfulAnalyses = analyzedCars.filter(car => car.data !== null);
    
    console.log(`✅ ${successfulAnalyses.length} veículo(s) analisado(s) com sucesso`);

    if (successfulAnalyses.length === 0) {
      throw new Error('Failed to analyze any vehicle');
    }

    const comparisonHTML = await this.comparisonFilter.process(analyzedCars);

    // Preparar dados para resposta
    const allCarsData: Record<string, CarData> = {};
    analyzedCars.forEach((car) => {
      if (car.data) {
        const key = car.year ? `${car.carModel},${car.year}` : car.carModel;
        allCarsData[key] = car.data;
      }
    });

    return {
      analyzedCars,
      successfulAnalyses,
      allCarsData,
      comparisonHTML
    };
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to run search + AI analysis',
    usage: {
      method: 'POST',
      body: '["Toyota Corolla, 2020", "Honda Civic, 2021"]'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const carItems: string[] = await request.json();

    if (!Array.isArray(carItems) || carItems.length === 0) {
      return NextResponse.json({ 
        error: 'Array of car items is required',
        example: '["Toyota Corolla, 2020", "Honda Civic, 2021"]'
      }, { status: 400 });
    }

    const pipeline = new CarAnalysisPipeline();
    
    const result = await withTimeout(
      pipeline.execute(carItems),
      TOTAL_REQUEST_TIMEOUT,
      'Total request timeout exceeded'
    );

    return NextResponse.json({
      success: true,
      totalVehicles: carItems.length,
      analyzedVehicles: result.successfulAnalyses.length,
      data: result.allCarsData,
      comparisonHTML: result.comparisonHTML
    });

  } catch (error) {
    console.error('❌ Search-Analyze error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}