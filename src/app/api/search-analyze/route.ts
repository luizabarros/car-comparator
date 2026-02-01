export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
export const dynamicParams = true
export const fetchCache = 'force-no-store'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server';
import { LLMAnalyzer } from '../../../lib/llm-analyzer';
import { CarData } from '@/types/car'
import { SearchAPI } from '@/lib/search'

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

    console.log(`🚗 Iniciando análise de ${carItems.length} veículo(s)...`);

    const allCarsData: Record<string, CarData> = {};

    const analysisResults = await Promise.allSettled(
      carItems.map(async (item) => {
        const [carModel, yearStr] = item.split(',').map(s => s.trim());
        const year = yearStr ? Number(yearStr) : undefined;

        if (!carModel) {
          throw new Error(`Invalid car model in item: "${item}"`);
        }

        console.log(`🔍 Buscando URLs para: ${carModel} ${year || ''}`);

        const searchResults = await SearchAPI.searchCarSites(carModel, year);

        if (!searchResults || searchResults.length === 0) {
          console.warn(`⚠️ Nenhuma URL encontrada para: ${carModel}`);
          return { carModel, year, data: null, error: 'No search results found' };
        }

        console.log(`✅ Encontradas ${searchResults.length} URLs para ${carModel}`);

        const organicUrls = searchResults
          .filter(r => r.type === 'organic' && r.link)
          .map(r => r.link)
          .slice(0, 10);

        const reclameAquiResults = searchResults.filter(r => 
          r.type === 'organic' && 
          r.link && 
          r.link.includes('reclameaqui.com.br')
        );

        const imageResults = searchResults.filter(r => r.type === 'image');

        const dealershipResults = searchResults.filter(r => r.type === 'local');

        console.log(`🤖 Extraindo dados via LLM para: ${carModel}`);
        const carData = await LLMAnalyzer.extractCarDataFromURLs(
          organicUrls,
          carModel,
          year,
          {
            organic: searchResults.filter(r => r.type === 'organic'),
            reclameaqui: reclameAquiResults,
            images: imageResults,
            dealerships: dealershipResults
          }
        );

        const key = year ? `${carModel},${year}` : carModel;
        allCarsData[key] = carData;

        console.log(`✅ Dados extraídos com sucesso: ${carModel}`);

        return { carModel, year, data: carData };
      })
    );

    const successfulAnalyses = analysisResults.filter(
      r => r.status === 'fulfilled' && r.value.data !== null
    );

    if (successfulAnalyses.length === 0) {
      return NextResponse.json({
        error: 'Failed to analyze any vehicle',
        details: analysisResults.map(r => 
          r.status === 'rejected' ? r.reason.message : 'Unknown error'
        )
      }, { status: 500 });
    }

    console.log(`✅ ${successfulAnalyses.length} veículo(s) analisado(s) com sucesso`);

    console.log(`📊 Gerando comparativo HTML...`);
    const comparisonHTML = await LLMAnalyzer.generateComparisonHTML(allCarsData);

    console.log(`✅ Comparativo gerado com sucesso!`);

    return NextResponse.json({
      success: true,
      totalVehicles: carItems.length,
      analyzedVehicles: successfulAnalyses.length,
      data: allCarsData,
      comparisonHTML: comparisonHTML
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