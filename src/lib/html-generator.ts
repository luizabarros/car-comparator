import Handlebars from 'handlebars';
import { CarData, ComparisonResult } from '@/types/car';
import { ComparisonAlgorithm } from './comparison-algorithm';

Handlebars.registerHelper('formatPrice', function (price: number | null) {
  if (price === null || price === undefined) return 'N/D';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(price);
});

Handlebars.registerHelper('formatNumber', function (num: number | null, decimals?: number) {
  if (num === null || num === undefined) return 'N/D';
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals || 0,
    maximumFractionDigits: decimals || 2,
  });
});

Handlebars.registerHelper('eq', function (a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper('or', function (...args: any[]) {
  return args.slice(0, -1).some(Boolean);
});

Handlebars.registerHelper(
  'getBestClass',
  function (carName: string, bestCar: string, worstCar: string) {
    if (carName === bestCar)
      return 'bg-green-50 border-l-4 border-green-500 font-bold text-green-900';
    if (carName === worstCar) return 'bg-red-50 border-l-4 border-red-500 text-red-900';
    return 'bg-gray-50';
  },
);

Handlebars.registerHelper('getBadge', function (carName: string, bestCar: string) {
  if (carName === bestCar)
    return '<span class="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">Melhor</span>';
  return '';
});

Handlebars.registerHelper('stars', function (rating: number | null) {
  if (rating === null || rating === undefined) return 'N/D';
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let stars = '';
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star text-yellow-500"></i>';
  }
  if (hasHalf) {
    stars += '<i class="fas fa-star-half-alt text-yellow-500"></i>';
  }
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star text-gray-300"></i>';
  }
  return new Handlebars.SafeString(stars);
});

Handlebars.registerHelper('percentage', function (score: number) {
  return Math.round(score);
});

Handlebars.registerHelper('json', function (context: any) {
  return JSON.stringify(context, null, 2);
});

export class HTMLGenerator {
  static generate(carsData: Record<string, CarData>): string {
    console.log('🎨 Gerando HTML com template Handlebars...');

    const comparison: ComparisonResult = ComparisonAlgorithm.compare(carsData);

    const templateData = {
      cars: Object.entries(carsData).map(([name, data]) => ({
        name,
        data,
        score: comparison.scores[name],
      })),
      comparison,
      timestamp: new Date().toLocaleString('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
    };

    const template = this.getTemplate();
    const compiledTemplate = Handlebars.compile(template);

    console.log('✅ HTML gerado com sucesso!');
    return compiledTemplate(templateData);
  }

  private static getTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comparação de Veículos - Análise Completa</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
  
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    
    <!-- HEADER -->
    <header class="mb-12 text-center">
      <div class="inline-block bg-white rounded-2xl shadow-lg px-8 py-6 mb-6">
        <h1 class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
          <i class="fas fa-car-side"></i> Comparação de Veículos
        </h1>
      </div>
    </header>

    <!-- CARDS DOS CARROS -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      {{#each cars}}
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden hover-scale">
        <!-- Imagem do Carro -->
        {{#if data.imagens.[0].imageUrl}}
        <div class="relative h-56 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700">
          <img src="{{data.imagens.[0].imageUrl}}" alt="{{name}}" 
               class="w-full h-full object-cover"
               onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'flex items-center justify-center h-full\\'><i class=\\'fas fa-car text-white text-6xl\\'></i></div>'">
        </div>
        {{else}}
        <div class="h-56 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
          <i class="fas fa-car text-white text-7xl opacity-50"></i>
        </div>
        {{/if}}
        
        <div class="p-6">
          <div class="flex items-start justify-between mb-3">
            <h2 class="text-2xl font-bold text-gray-900">{{name}}</h2>
            {{#if (eq name ../comparison.winner)}}
            <span class="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold rounded-full flex items-center">
              <i class="fas fa-trophy mr-1"></i> VENCEDOR
            </span>
            {{/if}}
          </div>
          
          <div class="mb-4">
            <div class="text-sm text-gray-600 mb-1">Preço</div>
            <p class="text-4xl font-black text-blue-600">
              {{formatPrice data.informacoes_gerais.preco}}
            </p>
          </div>
          
          <div class="space-y-2 text-sm border-t pt-4">
            <div class="flex justify-between">
              <span class="text-gray-600"><i class="fas fa-certificate text-blue-500 mr-2"></i>IPVA/ano:</span>
              <strong class="text-gray-900">{{formatPrice data.informacoes_gerais.ipva}}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600"><i class="fas fa-shield-alt text-green-500 mr-2"></i>Seguro/ano:</span>
              <strong class="text-gray-900">{{formatPrice data.informacoes_gerais.seguro}}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600"><i class="fas fa-calendar-check text-purple-500 mr-2"></i>Garantia:</span>
              <strong class="text-gray-900">{{#if data.informacoes_gerais.garantia}}{{data.informacoes_gerais.garantia}}{{else}}N/D{{/if}}</strong>
            </div>
          </div>

          <!-- Score Geral -->
          <div class="mt-6 pt-4 border-t">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-gray-700">Pontuação Geral</span>
              <span class="text-2xl font-black text-blue-600">{{percentage score.percentage}}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div class="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
                  style="width: {{score.percentage}}%"></div>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              Pontuação geral baseada em custo, benefícios e manutenção. Quanto maior, melhor o equilíbrio geral.
            </p>
          </div>
        </div>
      </div>
      {{/each}}
    </div>

    <!-- ANÁLISE EM LINGUAGEM HUMANA -->
    <div class="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-l-4 border-blue-500 rounded-2xl shadow-lg p-8 mb-12">
      <div class="flex items-center mb-6">
        <div>
          <h3 class="text-3xl font-bold text-gray-900">💡 Análise Simplificada</h3>
          <p class="text-gray-600">Entenda a comparação em linguagem clara</p>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-xl p-6 shadow-md">
          <h4 class="font-bold text-lg text-gray-900 mb-2 flex items-center">
            <i class="fas fa-chart-line text-blue-500 mr-2"></i> Visão Geral
          </h4>
          <p class="text-gray-700 leading-relaxed">{{comparison.humanAnalysis.overall}}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white rounded-xl p-5 shadow-md">
            <h4 class="font-bold text-gray-900 mb-2 flex items-center">
              <i class="fas fa-dollar-sign text-green-500 mr-2"></i> Preço
            </h4>
            <p class="text-sm text-gray-700">{{comparison.humanAnalysis.priceAnalysis}}</p>
          </div>

          <div class="bg-white rounded-xl p-5 shadow-md">
            <h4 class="font-bold text-gray-900 mb-2 flex items-center">
              <i class="fas fa-tachometer-alt text-red-500 mr-2"></i> Desempenho
            </h4>
            <p class="text-sm text-gray-700">{{comparison.humanAnalysis.performanceAnalysis}}</p>
          </div>

          <div class="bg-white rounded-xl p-5 shadow-md">
            <h4 class="font-bold text-gray-900 mb-2 flex items-center">
              <i class="fas fa-gas-pump text-orange-500 mr-2"></i> Economia
            </h4>
            <p class="text-sm text-gray-700">{{comparison.humanAnalysis.efficiencyAnalysis}}</p>
          </div>

          <div class="bg-white rounded-xl p-5 shadow-md">
            <h4 class="font-bold text-gray-900 mb-2 flex items-center">
              <i class="fas fa-shield-alt text-blue-500 mr-2"></i> Segurança
            </h4>
            <p class="text-sm text-gray-700">{{comparison.humanAnalysis.safetyAnalysis}}</p>
          </div>
        </div>

        <div class="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg">
          <h4 class="font-bold text-xl mb-3 flex items-center">
            <i class="fas fa-trophy mr-2"></i> Veredito Final
          </h4>
          <p class="text-lg leading-relaxed">{{comparison.humanAnalysis.finalVerdict}}</p>
        </div>
      </div>
    </div>

    <!-- FICHAS TÉCNICAS COMPLETAS -->
    <div class="mb-12">
      <h2 class="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <i class="fas fa-clipboard-list text-blue-600 mr-3"></i> Fichas Técnicas Completas
      </h2>

      <!-- TABELA: Informações Gerais -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h3 class="text-xl font-bold text-white flex items-center">
            <i class="fas fa-info-circle mr-2"></i> Informações Gerais
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Critério</th>
                {{#each cars}}
                <th class="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">{{name}}</th>
                {{/each}}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {{#each comparison.highlights.general}}
              <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                  {{label}}
                  {{#if unit}}<span class="text-xs text-gray-500 ml-1">({{unit}})</span>{{/if}}
                </td>
                {{#each ../cars}}
                <td class="px-6 py-4 text-center whitespace-nowrap {{getBestClass name ../best ../worst}}">
                  <div class="flex items-center justify-center">
                    {{#if (eq name ../best)}}
                    <i class="fas fa-check-circle text-green-600 mr-2"></i>
                    {{/if}}
                    <span>
                      {{#if (or (eq ../field "informacoes_gerais.preco") (eq ../field "informacoes_gerais.ipva") (eq ../field "informacoes_gerais.seguro"))}}
                        {{formatPrice (lookup ../values name)}}
                      {{else}}
                        {{#if (lookup ../values name)}}{{lookup ../values name}}{{else}}N/D{{/if}}
                      {{/if}}
                    </span>
                  </div>
                </td>
                {{/each}}
              </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
        <div class="bg-blue-50 px-6 py-3 border-t border-blue-100">
          <p class="text-sm text-gray-700"><i class="fas fa-info-circle text-blue-600 mr-2"></i><strong>O que isso significa?</strong> {{comparison.highlights.general.[0].humanExplanation}}</p>
        </div>
      </div>

      <!-- TABELA: Motor e Propulsão -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div class="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <h3 class="text-xl font-bold text-white flex items-center">
            <i class="fas fa-cog mr-2"></i> Motor e Propulsão
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Especificação</th>
                {{#each cars}}
                <th class="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">{{name}}</th>
                {{/each}}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {{#each comparison.highlights.motor}}
              <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                  {{label}}
                  {{#if unit}}<span class="text-xs text-gray-500 ml-1">({{unit}})</span>{{/if}}
                </td>
                {{#each ../cars}}
                <td class="px-6 py-4 text-center whitespace-nowrap {{getBestClass name ../best ../worst}}">
                  <div class="flex items-center justify-center">
                    {{#if (eq name ../best)}}
                    <i class="fas fa-check-circle text-green-600 mr-2"></i>
                    {{/if}}
                    <span>{{#if (lookup ../values name)}}{{formatNumber (lookup ../values name) 1}}{{else}}N/D{{/if}}</span>
                  </div>
                </td>
                {{/each}}
              </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
        <div class="bg-red-50 px-6 py-3 border-t border-red-100">
          <p class="text-sm text-gray-700"><i class="fas fa-lightbulb text-red-600 mr-2"></i><strong>Dica:</strong> Mais potência significa melhor desempenho em ultrapassagens e subidas. Mais torque ajuda na retomada de velocidade.</p>
        </div>
      </div>

      <!-- TABELA: Desempenho e Consumo -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <h3 class="text-xl font-bold text-white flex items-center">
            <i class="fas fa-tachometer-alt mr-2"></i> Desempenho e Eficiência
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Métrica</th>
                {{#each cars}}
                <th class="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">{{name}}</th>
                {{/each}}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {{#each comparison.highlights.performance}}
              <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                  {{label}}
                  {{#if unit}}<span class="text-xs text-gray-500 ml-1">({{unit}})</span>{{/if}}
                </td>
                {{#each ../cars}}
                <td class="px-6 py-4 text-center whitespace-nowrap {{getBestClass name ../best ../worst}}">
                  <div class="flex items-center justify-center">
                    {{#if (eq name ../best)}}
                    <i class="fas fa-check-circle text-green-600 mr-2"></i>
                    {{/if}}
                    <span>{{#if (lookup ../values name)}}{{formatNumber (lookup ../values name) 1}}{{else}}N/D{{/if}}</span>
                  </div>
                </td>
                {{/each}}
              </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
        <div class="bg-green-50 px-6 py-3 border-t border-green-100">
          <p class="text-sm text-gray-700"><i class="fas fa-leaf text-green-600 mr-2"></i><strong>Economia:</strong> Maior consumo (km/l) = menos gastos com combustível. Um carro que faz 15 km/l economiza muito mais que um de 10 km/l.</p>
        </div>
      </div>

      <!-- TABELA: Dimensões -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
          <h3 class="text-xl font-bold text-white flex items-center">
            <i class="fas fa-ruler-combined mr-2"></i> Dimensões e Capacidade
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Medida</th>
                {{#each cars}}
                <th class="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">{{name}}</th>
                {{/each}}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {{#each comparison.highlights.dimensions}}
              <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                  {{label}}
                  {{#if unit}}<span class="text-xs text-gray-500 ml-1">({{unit}})</span>{{/if}}
                </td>
                {{#each ../cars}}
                <td class="px-6 py-4 text-center whitespace-nowrap {{getBestClass name ../best ../worst}}">
                  <div class="flex items-center justify-center">
                    {{#if (eq name ../best)}}
                    <i class="fas fa-check-circle text-green-600 mr-2"></i>
                    {{/if}}
                    <span>{{#if (lookup ../values name)}}{{formatNumber (lookup ../values name) 0}}{{else}}N/D{{/if}}</span>
                  </div>
                </td>
                {{/each}}
              </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
        <div class="bg-purple-50 px-6 py-3 border-t border-purple-100">
          <p class="text-sm text-gray-700"><i class="fas fa-suitcase text-purple-600 mr-2"></i><strong>Porta-malas:</strong> Maior capacidade é ideal para viagens e famílias. Peso menor ajuda na economia de combustível.</p>
        </div>
      </div>

      <!-- TABELA: Segurança (Crash Test) -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div class="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
          <h3 class="text-xl font-bold text-white flex items-center">
            <i class="fas fa-shield-alt mr-2"></i> Avaliação de Segurança (Crash Test)
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Critério</th>
                {{#each cars}}
                <th class="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">{{name}}</th>
                {{/each}}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {{#each comparison.highlights.safety}}
              <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                  {{label}}
                </td>
                {{#each ../cars}}
                <td class="px-6 py-4 text-center {{getBestClass name ../best ../worst}}">
                  <div class="flex items-center justify-center">
                    {{#if (eq name ../best)}}
                    <i class="fas fa-trophy text-yellow-500 mr-2"></i>
                    {{/if}}
                    <span>{{{stars (lookup ../values name)}}}</span>
                  </div>
                </td>
                {{/each}}
              </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
        <div class="bg-orange-50 px-6 py-3 border-t border-orange-100">
          <p class="text-sm text-gray-700"><i class="fas fa-baby text-orange-600 mr-2"></i><strong>Importante para famílias:</strong> Avaliações Latin NCAP medem proteção em colisões. Quanto mais estrelas, mais seguro o veículo.</p>
        </div>
      </div>

      <!-- TABELA: Transmissão -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div class="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
          <h3 class="text-xl font-bold text-white flex items-center">
            <i class="fas fa-cogs mr-2"></i> Transmissão e Tração
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Especificação</th>
                {{#each cars}}
                <th class="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">{{name}}</th>
                {{/each}}
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {{#each comparison.highlights.transmission}}
              <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{{label}}</td>
                {{#each ../cars}}
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <span class="text-gray-900">{{#if (lookup ../values name)}}{{lookup ../values name}}{{else}}N/D{{/if}}</span>
                </td>
                {{/each}}
              </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
        <div class="bg-indigo-50 px-6 py-3 border-t border-indigo-100">
          <p class="text-sm text-gray-700"><i class="fas fa-exchange-alt text-indigo-600 mr-2"></i><strong>Câmbio automático</strong> oferece mais conforto no trânsito. <strong>Manual</strong> é mais econômico e dá controle total.</p>
        </div>
      </div>
    </div>

    <!-- TABELA: Conforto -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
      <div class="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4">
        <h3 class="text-xl font-bold text-white flex items-center">
          <i class="fas fa-couch mr-2"></i> Conforto e Conveniência
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Item</th>
              {{#each cars}}
              <th class="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">{{name}}</th>
              {{/each}}
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Ar Condicionado</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                <span class="text-gray-900">{{#if data.conforto.ar_condicionado}}{{data.conforto.ar_condicionado}}{{else}}N/D{{/if}}</span>
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Direção Elétrica</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.conforto.direcao_eletrica}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Vidros Elétricos</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                <span class="text-gray-900">{{#if data.conforto.vidros_eletricos}}{{data.conforto.vidros_eletricos}}{{else}}N/D{{/if}}</span>
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Travas Elétricas</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.conforto.travas_eletricas}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Volante Multifuncional</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.conforto.volante_multifuncional}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Computador de Bordo</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.conforto.computador_bordo}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Controle de Cruzeiro</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.conforto.controle_cruzeiro}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Sensor de Chuva</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.conforto.sensor_chuva}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Bancos em Couro</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.conforto.banco_couro}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
          </tbody>
        </table>
      </div>
      <div class="bg-cyan-50 px-6 py-3 border-t border-cyan-100">
        <p class="text-sm text-gray-700"><i class="fas fa-star text-cyan-600 mr-2"></i><strong>Conforto:</strong> Itens de conveniência que tornam a experiência de dirigir mais agradável.</p>
      </div>
    </div>

    <!-- TABELA: Segurança Ativa/Passiva -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
      <div class="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
        <h3 class="text-xl font-bold text-white flex items-center">
          <i class="fas fa-shield-alt mr-2"></i> Segurança Ativa e Passiva
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Sistema de Segurança</th>
              {{#each cars}}
              <th class="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">{{name}}</th>
              {{/each}}
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Airbag Motorista</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.seguranca.airbags_motorista}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Airbag Passageiro</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.seguranca.airbags_passageiro}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Airbags Laterais</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.seguranca.airbags_laterais}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Airbags Cortina</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.seguranca.airbags_cortina}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">ABS</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.seguranca.abs}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Controle de Tração</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.seguranca.controle_tracao}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Controle de Estabilidade</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.seguranca.controle_estabilidade}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Câmera de Ré</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.seguranca.camera_re}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Sensores de Estacionamento</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.seguranca.sensores_estacionamento_traseiro}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Alerta Ponto Cego</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.seguranca.aviso_ponto_cego}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Frenagem Automática de Emergência</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.seguranca.frenagem_automatica_emergencia}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
          </tbody>
        </table>
      </div>
      <div class="bg-red-50 px-6 py-3 border-t border-red-100">
        <p class="text-sm text-gray-700"><i class="fas fa-exclamation-triangle text-red-600 mr-2"></i><strong>Segurança:</strong> Sistemas que previnem acidentes (ativa) ou protegem ocupantes em colisões (passiva).</p>
      </div>
    </div>

    <!-- TABELA: Infotenimento -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
      <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <h3 class="text-xl font-bold text-white flex items-center">
          <i class="fas fa-mobile-alt mr-2"></i> Infotenimento e Conectividade
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Recurso</th>
              {{#each cars}}
              <th class="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">{{name}}</th>
              {{/each}}
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Central Multimídia</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center">
                <span class="text-gray-900">{{#if data.infotenimento.central_multimidia}}{{data.infotenimento.central_multimidia}}{{else}}N/D{{/if}}</span>
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Tela Touch</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.infotenimento.tela_touch}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Tamanho da Tela</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center">
                <span class="text-gray-900">{{#if data.infotenimento.tamanho_tela}}{{data.infotenimento.tamanho_tela}}{{else}}N/D{{/if}}</span>
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Android Auto</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.infotenimento.android_auto}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Apple CarPlay</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.infotenimento.apple_carplay}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Bluetooth</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.infotenimento.bluetooth}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">USB</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.infotenimento.usb}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Sistema de Som</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center">
                <span class="text-gray-900">{{#if data.infotenimento.sistema_som}}{{data.infotenimento.sistema_som}}{{else}}N/D{{/if}}</span>
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Alto-falantes</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center">
                <span class="text-gray-900">{{#if data.infotenimento.numero_alto_falantes}}{{data.infotenimento.numero_alto_falantes}}{{else}}N/D{{/if}}</span>
              </td>
              {{/each}}
            </tr>
            <tr class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">Navegação GPS</td>
              {{#each cars}}
              <td class="px-6 py-4 text-center whitespace-nowrap">
                {{#if data.infotenimento.navegacao_gps}}
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                {{else}}
                <i class="fas fa-times-circle text-red-400 text-xl"></i>
                {{/if}}
              </td>
              {{/each}}
            </tr>
          </tbody>
        </table>
      </div>
      <div class="bg-purple-50 px-6 py-3 border-t border-purple-100">
        <p class="text-sm text-gray-700"><i class="fas fa-wifi text-purple-600 mr-2"></i><strong>Conectividade:</strong> Sistemas de entretenimento e conectividade com smartphones.</p>
      </div>
    </div>

    <!-- RECLAMAÇÕES (RECLAME AQUI) -->
    {{#if (or cars.[0].data.reclamacoes cars.[1].data.reclamacoes)}}
    <div class="mb-12">
      <h2 class="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <i class="fas fa-exclamation-triangle text-yellow-500 mr-3"></i> Reclamações (Reclame Aqui)
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {{#each cars}}
        {{#if data.reclamacoes}}
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div class="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
            <h4 class="text-xl font-bold text-white">{{name}}</h4>
          </div>
          
          <div class="p-6">
            {{#if data.reclamacoes_resumo}}
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
              <h5 class="font-bold text-gray-900 mb-2 flex items-center">
                <i class="fas fa-clipboard-check text-yellow-600 mr-2"></i> Resumo Geral
              </h5>
              <p class="text-sm text-gray-700 leading-relaxed">{{data.reclamacoes_resumo}}</p>
            </div>
            {{/if}}

            {{#if data.reclamacoes.length}}
            <h5 class="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Principais Reclamações:</h5>
            <div class="space-y-3">
              {{#each data.reclamacoes}}
              <div class="bg-gray-50 rounded-lg p-4 transition border-l-4 border-orange-500">
                <div class="flex items-start space-x-3">
                  <i class="fas fa-comment-dots text-orange-500 mt-1 text-lg"></i>
                  <div class="flex-1">
                    <h6 class="font-semibold text-gray-900 text-sm mb-1">{{titulo}}</h6>
                    <p class="text-xs text-gray-600 mb-2">{{descricao}}</p>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-gray-500">
                        {{#if data}}
                          <i class="far fa-calendar mr-1"></i>{{data}}
                        {{/if}}
                      </span>

                      <a href="{{link}}" target="_blank" rel="noopener noreferrer" 
                        class="text-blue-600 text-xs hover:underline font-semibold flex items-center">
                        Ver detalhes <i class="fas fa-external-link-alt ml-1"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              {{/each}}
            </div>
            {{else}}
            <div class="text-center py-8 text-gray-400">
              <i class="fas fa-check-circle text-5xl mb-3"></i>
              <p>Nenhuma reclamação encontrada</p>
            </div>
            {{/if}}
          </div>

          <div class="bg-gray-50 px-6 py-3 border-t">
            <p class="text-xs text-gray-600 flex items-center">
              <i class="fas fa-info-circle text-blue-500 mr-2"></i>
              Fonte: <a href="https://www.reclameaqui.com.br" target="_blank" class="text-blue-600 hover:underline ml-1">Reclame Aqui</a>
            </p>
          </div>
        </div>
        {{/if}}
        {{/each}}
      </div>
    </div>
    {{/if}}

    <!-- CONCESSIONÁRIAS -->
    {{#if (or cars.[0].data.concessionarias_proximas cars.[1].data.concessionarias_proximas)}}
    <div class="mb-12">
      <h2 class="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <i class="fas fa-store text-blue-600 mr-3"></i> Concessionárias e Assistência Técnica
      </h2>

      <div class="bg-white rounded-2xl shadow-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {{#each cars}}
          {{#each data.concessionarias_proximas}}
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 hover:shadow-lg transition border border-blue-100 hover-scale">
            <div class="flex items-start justify-between mb-3">
              <i class="fas fa-building text-blue-600 text-2xl"></i>
              <span class="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-bold">{{../name}}</span>
            </div>
            <h5 class="font-bold text-gray-900 text-sm mb-3 line-clamp-2">{{nome}}</h5>
            <div class="space-y-2 text-xs text-gray-700">
              <div class="flex items-center">
                <i class="fas fa-map-marker-alt text-red-500 mr-2 w-4"></i>
                <span>{{cidade}}</span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-phone text-green-500 mr-2 w-4"></i>
                <span>{{contato}}</span>
              </div>
              {{#if site}}
              <div class="pt-2 border-t">
                <a href="{{site}}" target="_blank" rel="noopener noreferrer" 
                   class="text-blue-600 hover:text-blue-800 font-semibold flex items-center justify-center py-2 bg-white rounded-lg hover:bg-blue-50 transition">
                  <i class="fas fa-globe mr-2"></i> Visitar Site
                </a>
              </div>
              {{/if}}
            </div>
          </div>
          {{/each}}
          {{/each}}
        </div>
      </div>
    </div>
    {{/if}}

    <!-- RECOMENDAÇÕES FINAIS -->
    <div class="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 rounded-2xl shadow-2xl p-8 text-white mb-12">
      <div class="flex items-center mb-6">
        <i class="fas fa-trophy text-yellow-300 text-5xl mr-5"></i>
        <div>
          <h2 class="text-4xl font-black">Recomendações Finais</h2>
          <p class="text-green-100">Baseado em nossa análise completa</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30">
          <div class="flex items-center mb-3">
            <i class="fas fa-dollar-sign text-yellow-300 text-2xl mr-3"></i>
            <h4 class="font-bold text-xl">Melhor Custo-Benefício</h4>
          </div>
          <p class="text-3xl font-black mb-2">{{comparison.winner}}</p>
          <p class="text-sm text-green-100">Equilibra preço, desempenho e qualidade</p>
        </div>

        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30">
          <div class="flex items-center mb-3">
            <i class="fas fa-tag text-yellow-300 text-2xl mr-3"></i>
            <h4 class="font-bold text-xl">Mais Econômico</h4>
          </div>
          <p class="text-3xl font-black mb-2">{{comparison.recommendations.bestPrice}}</p>
          <p class="text-sm text-green-100">Menor preço de compra</p>
        </div>

        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30">
          <div class="flex items-center mb-3">
            <i class="fas fa-bolt text-yellow-300 text-2xl mr-3"></i>
            <h4 class="font-bold text-xl">Mais Potente</h4>
          </div>
          <p class="text-3xl font-black mb-2">{{comparison.recommendations.bestPerformance}}</p>
          <p class="text-sm text-green-100">Maior desempenho e potência</p>
        </div>

        <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-30">
          <div class="flex items-center mb-3">
            <i class="fas fa-shield-alt text-yellow-300 text-2xl mr-3"></i>
            <h4 class="font-bold text-xl">Mais Seguro</h4>
          </div>
          <p class="text-3xl font-black mb-2">{{comparison.recommendations.bestSafety}}</p>
          <p class="text-sm text-green-100">Melhores notas de segurança</p>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="text-center py-8 border-t border-gray-200">
      <p class="text-xs text-gray-500">
        Dados obtidos de fontes públicas. Sempre confirme informações diretamente com concessionárias.
      </p>
    </footer>

  </div>

</body>
</html>
    `;
  }
}
