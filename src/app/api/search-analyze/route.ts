export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
export const dynamicParams = true
export const fetchCache = 'force-no-store'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server';
import { Analyzer } from '../../../lib/analyzer';
import { AnalyzedCar, CarData, CarItem, ProcessedURLs, SearchFilterResult, SearchResult } from '@/types/car'
import { SearchAPI } from '@/lib/search'
import { HTMLGenerator } from '@/lib/html-generator'

const ANALYSIS_TIMEOUT_PER_CAR = 60000;
const SEARCH_TIMEOUT_PER_CAR = 30000;
const BASE_COMPARISON_TIMEOUT = 30000;
const EXTRA_COMPARISON_PER_CAR = 15000;

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
  async process(carItems: CarItem[]): Promise<SearchFilterResult[]> {
    return await Promise.all(
      carItems.map(async (item) => {
        console.log(`🔍 Buscando URLs para: ${item.carModel} ${item.year || ''}`);
        
        const searchResults = await withTimeout(
          SearchAPI.searchCarSites(item.carModel, item.year),
          SEARCH_TIMEOUT_PER_CAR,
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
  }
}

class URLProcessingFilter {
  async process(searchResults: SearchFilterResult[]): Promise<ProcessedURLs[]> {
    return Promise.all(
      searchResults.map(async (result) => {
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
      })
    );
  }
}

class LLMExtractionFilter {
  async process(processedURLs: ProcessedURLs[]): Promise<AnalyzedCar[]> {
    return await Promise.all(
      processedURLs.map(async (item) => {
        console.log(`🤖 Extraindo dados via LLM para: ${item.carModel}`);
        
        const carData = await withTimeout(
          Analyzer.extractCarDataFromURLs(
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
          ANALYSIS_TIMEOUT_PER_CAR,
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

    const numCars = Object.keys(allCarsData).length;

    console.log(`📊 Gerando comparativo HTML para ${numCars} veículo(s)... (template)`);
    
    const comparisonHTML = HTMLGenerator.generate(allCarsData);

    console.log(`✅ Comparativo gerado com sucesso em ~50ms!`);

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

    const parsedItems = await this.parseFilter.process(carItems);
    const searchResults = await this.searchFilter.process(parsedItems);
    const processedURLs = await this.urlProcessingFilter.process(searchResults);
    const analyzedCars = await this.llmExtractionFilter.process(processedURLs);
    
    console.log(`✅ ${analyzedCars.length} veículo(s) analisado(s) com sucesso`);

    const comparisonHTML = await this.comparisonFilter.process(analyzedCars);

    const allCarsData: Record<string, CarData> = {};
    analyzedCars.forEach((car) => {
      if (car.data) {
        const key = car.year ? `${car.carModel},${car.year}` : car.carModel;
        allCarsData[key] = car.data;
      }
    });

    return {
      analyzedCars,
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

    const numCars = carItems.length;
    
    const totalTimeout = Math.max(
      SEARCH_TIMEOUT_PER_CAR,
      ANALYSIS_TIMEOUT_PER_CAR
    ) + BASE_COMPARISON_TIMEOUT + (EXTRA_COMPARISON_PER_CAR * (numCars - 1)) + 10000;
    
    console.log(`⏱️ Timeout total para ${numCars} carro(s): ${totalTimeout/1000}s`);

    const pipeline = new CarAnalysisPipeline();
    
    const result = await withTimeout(
      pipeline.execute(carItems),
      totalTimeout,
      `Total request timeout exceeded for ${numCars} cars`
    );

    return NextResponse.json({
      success: true,
      totalVehicles: carItems.length,
      analyzedVehicles: carItems.length,
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