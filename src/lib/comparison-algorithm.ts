import { CarData, CategoryScore, ComparisonResult, FieldComparison } from '@/types/car';

export class ComparisonAlgorithm {
  static compare(carsData: Record<string, CarData>): ComparisonResult {
    const carNames = Object.keys(carsData);

    const scores: Record<string, CategoryScore> = {};
    carNames.forEach((name) => {
      scores[name] = {
        carName: name,
        score: 0,
        maxScore: 100,
        percentage: 0,
      };
    });

    const priceComparison = this.compareCategory(
      carsData,
      ['informacoes_gerais.preco', 'informacoes_gerais.ipva', 'informacoes_gerais.seguro'],
      'lower_better',
      25,
    );

    const performanceComparison = this.compareCategory(
      carsData,
      ['motor.potencia_maxima', 'motor.torque_maximo', 'desempenho.aceleracao_0_100'],
      'mixed',
      25,
    );

    const efficiencyComparison = this.compareCategory(
      carsData,
      ['consumo.urbano', 'consumo.rodoviario'],
      'higher_better',
      25,
    );

    // CORREÇÃO: Incluir NCAP e assistencia no cálculo de segurança
    const safetyComparison = this.compareCategory(
      carsData,
      [
        'avaliacao.protecao_adultos',
        'avaliacao.protecao_criancas',
        'avaliacao.protecao_pedestres',
        'avaliacao.assistencia',
        'avaliacao.ncap',
      ],
      'higher_better',
      25,
    );

    carNames.forEach((name) => {
      scores[name].score =
        priceComparison.scores[name] +
        performanceComparison.scores[name] +
        efficiencyComparison.scores[name] +
        safetyComparison.scores[name];
      scores[name].percentage = scores[name].score;
    });

    const winner = Object.entries(scores).reduce(
      (best, [name, score]) => (score.score > best.score ? { name, score: score.score } : best),
      { name: carNames[0], score: scores[carNames[0]].score },
    ).name;

    const highlights = {
      general: this.buildFieldComparisons(carsData, [
        {
          field: 'informacoes_gerais.preco',
          label: 'Preço',
          unit: 'R$',
          comparison: 'lower_better',
        },
        { field: 'informacoes_gerais.ipva', label: 'IPVA', unit: 'R$', comparison: 'lower_better' },
        {
          field: 'informacoes_gerais.seguro',
          label: 'Seguro',
          unit: 'R$',
          comparison: 'lower_better',
        },
        { field: 'informacoes_gerais.garantia', label: 'Garantia', comparison: 'neutral' },
      ]),
      motor: this.buildFieldComparisons(carsData, [
        { field: 'motor.combustivel', label: 'Combustível', comparison: 'neutral' },
        {
          field: 'motor.potencia_maxima',
          label: 'Potência',
          unit: 'cv',
          comparison: 'higher_better',
        },
        {
          field: 'motor.torque_maximo',
          label: 'Torque',
          unit: 'kgfm',
          comparison: 'higher_better',
        },
        { field: 'motor.cilindrada', label: 'Cilindrada', unit: 'L', comparison: 'neutral' },
      ]),
      performance: this.buildFieldComparisons(carsData, [
        {
          field: 'desempenho.velocidade_max',
          label: 'Velocidade Máxima',
          unit: 'km/h',
          comparison: 'higher_better',
        },
        {
          field: 'desempenho.aceleracao_0_100',
          label: '0-100 km/h',
          unit: 's',
          comparison: 'lower_better',
        },
        {
          field: 'consumo.urbano',
          label: 'Consumo Urbano',
          unit: 'km/l',
          comparison: 'higher_better',
        },
        {
          field: 'consumo.rodoviario',
          label: 'Consumo Rodoviário',
          unit: 'km/l',
          comparison: 'higher_better',
        },
      ]),
      dimensions: this.buildFieldComparisons(carsData, [
        { field: 'dimensoes.comprimento', label: 'Comprimento', unit: 'mm', comparison: 'neutral' },
        { field: 'dimensoes.largura', label: 'Largura', unit: 'mm', comparison: 'neutral' },
        { field: 'dimensoes.altura', label: 'Altura', unit: 'mm', comparison: 'neutral' },
        {
          field: 'dimensoes.porta_malas',
          label: 'Porta-malas',
          unit: 'L',
          comparison: 'higher_better',
        },
        { field: 'dimensoes.peso', label: 'Peso', unit: 'kg', comparison: 'lower_better' },
      ]),
      safety: this.buildFieldComparisons(carsData, [
        {
          field: 'avaliacao.ncap',
          label: 'NCAP Global',
          unit: '★',
          comparison: 'higher_better',
        },
        {
          field: 'avaliacao.protecao_adultos',
          label: 'Proteção Adultos',
          unit: '★',
          comparison: 'higher_better',
        },
        {
          field: 'avaliacao.protecao_criancas',
          label: 'Proteção Crianças',
          unit: '★',
          comparison: 'higher_better',
        },
        {
          field: 'avaliacao.protecao_pedestres',
          label: 'Proteção Pedestres',
          unit: '★',
          comparison: 'higher_better',
        },
        {
          field: 'avaliacao.assistencia',
          label: 'Assistência',
          unit: '★',
          comparison: 'higher_better',
        },
      ]),
      transmission: this.buildFieldComparisons(carsData, [
        { field: 'transmissao.cambio', label: 'Câmbio', comparison: 'neutral' },
        { field: 'transmissao.marchas', label: 'Marchas', comparison: 'neutral' },
        { field: 'transmissao.tracao', label: 'Tração', comparison: 'neutral' },
      ]),
    };

    return {
      winner,
      scores,
      recommendations: {
        bestPrice: this.findBest(carsData, 'informacoes_gerais.preco', 'lower'),
        bestPerformance: this.findBest(carsData, 'motor.potencia_maxima', 'higher'),
        bestEfficiency: this.findBest(carsData, 'consumo.rodoviario', 'higher'),
        bestSafety: this.findBestSafety(carsData) || 'N/A',
        bestOverall: winner,
      },
      highlights,
      humanAnalysis: this.generateHumanAnalysis(carsData, highlights, winner),
    };
  }

  private static findBestSafety(carsData: Record<string, CarData>): string | null {
    const carNames = Object.keys(carsData);

    const safetyScores = carNames.map((name) => {
      const car = carsData[name];
      let score = 0;
      let count = 0;

      const ncapFields = [
        car.avaliacao?.ncap,
        car.avaliacao?.protecao_adultos,
        car.avaliacao?.protecao_criancas,
        car.avaliacao?.protecao_pedestres,
        car.avaliacao?.assistencia,
      ];

      ncapFields.forEach((value) => {
        if (value !== null && value !== undefined && !isNaN(Number(value))) {
          score += Number(value) * 2; // Peso dobrado para ratings NCAP
          count += 2;
        }
      });

      const passiveFeatures = [
        car.seguranca?.airbags_motorista,
        car.seguranca?.airbags_passageiro,
        car.seguranca?.airbags_laterais,
        car.seguranca?.airbags_cortina,
      ];

      passiveFeatures.forEach((value) => {
        if (value === true) {
          score += 1;
          count += 1;
        }
      });

      const activeFeatures = [
        car.seguranca?.abs,
        car.seguranca?.controle_tracao,
        car.seguranca?.controle_estabilidade,
        car.seguranca?.frenagem_automatica_emergencia,
        car.seguranca?.alerta_colisao_frontal,
        car.seguranca?.aviso_ponto_cego,
        car.seguranca?.alerta_saida_faixa,
      ];

      activeFeatures.forEach((value) => {
        if (value === true) {
          score += 1;
          count += 1;
        }
      });

      return {
        name,
        score: count > 0 ? score / count : 0,
        rawScore: score,
        count,
      };
    });

    const validScores = safetyScores.filter((s) => s.count > 0);

    if (validScores.length === 0) {
      return null;
    }

    const best = validScores.reduce((max, current) =>
      current.rawScore > max.rawScore ? current : max
    );

    return best.name;
  }

  private static generateSafetyAnalysis(
    carsData: Record<string, CarData>,
    highlights: Record<string, FieldComparison[]>,
  ): string {
    const carNames = Object.keys(carsData);
    
    const safetyDetails = carNames.map((name) => {
      const car = carsData[name];
      
      const ratings = {
        ncap: car.avaliacao?.ncap,
        adultos: car.avaliacao?.protecao_adultos,
        criancas: car.avaliacao?.protecao_criancas,
        pedestres: car.avaliacao?.protecao_pedestres,
        assistencia: car.avaliacao?.assistencia,
      };

      const airbags = [
        car.seguranca?.airbags_motorista,
        car.seguranca?.airbags_passageiro,
        car.seguranca?.airbags_laterais,
        car.seguranca?.airbags_cortina,
      ].filter((v) => v === true).length;

      const activeFeatures = [
        car.seguranca?.abs,
        car.seguranca?.controle_tracao,
        car.seguranca?.controle_estabilidade,
        car.seguranca?.frenagem_automatica_emergencia,
        car.seguranca?.alerta_colisao_frontal,
        car.seguranca?.aviso_ponto_cego,
        car.seguranca?.alerta_saida_faixa,
      ].filter((v) => v === true).length;

      let totalScore = 0;
      let ratingCount = 0;

      Object.values(ratings).forEach((rating) => {
        if (rating !== null && rating !== undefined && !isNaN(Number(rating))) {
          totalScore += Number(rating);
          ratingCount++;
        }
      });

      const avgRating = ratingCount > 0 ? totalScore / ratingCount : null;

      return {
        name,
        ratings,
        avgRating,
        airbags,
        activeFeatures,
        hasNCAP: ratingCount > 0,
      };
    });

    const withRatings = safetyDetails.filter((d) => d.hasNCAP);
    
    if (withRatings.length === 0) {
      const bestByFeatures = safetyDetails.reduce((max, current) => {
        const maxTotal = max.airbags + max.activeFeatures;
        const currentTotal = current.airbags + current.activeFeatures;
        return currentTotal > maxTotal ? current : max;
      });

      return `Em segurança, o ${bestByFeatures.name} se destaca com ${bestByFeatures.airbags} airbag(s) e ${bestByFeatures.activeFeatures} sistema(s) de assistência ativa. Dados de crash test NCAP não estão disponíveis para comparação detalhada.`;
    }

    const maxRating = Math.max(...withRatings.map((d) => d.avgRating!));
    const bestCars = withRatings.filter((d) => Math.abs(d.avgRating! - maxRating) < 0.1);

    if (bestCars.length === 1) {
      const best = bestCars[0];
      const ratingText =
        best.ratings.ncap !== null
          ? `${best.ratings.ncap} estrelas no NCAP`
          : `média de ${best.avgRating!.toFixed(1)} estrelas nas avaliações`;

      return `Em segurança, o ${best.name} lidera com ${ratingText}. Conta com ${best.airbags} airbag(s) e ${best.activeFeatures} sistema(s) de assistência ativa. Para famílias, este é um fator crucial na decisão.`;
    } else {
      const names = bestCars.map((c) => c.name).join(' e ');
      const best = bestCars[0];

      return `Em segurança, há empate técnico entre ${names}, ambos com avaliações NCAP de aproximadamente ${maxRating.toFixed(1)} estrelas. Os dois oferecem proteção equivalente para ocupantes e pedestres. Compare os sistemas de assistência específicos de cada um para decidir.`;
    }
  }

  private static generateHumanAnalysis(
    carsData: Record<string, CarData>,
    highlights: Record<string, FieldComparison[]>,
    winner: string,
  ): any {
    const carNames = Object.keys(carsData);

    const priceField = highlights.general.find((h) => h.field === 'informacoes_gerais.preco');
    const bestPriceCar = priceField?.best || carNames[0];
    const worstPriceCar = priceField?.worst || carNames[0];
    const priceDiff = priceField
      ? Math.abs((priceField.values[bestPriceCar] || 0) - (priceField.values[worstPriceCar] || 0))
      : 0;

    const powerField = highlights.motor.find((h) => h.field === 'motor.potencia_maxima');
    const bestPowerCar = powerField?.best || carNames[0];

    const consumptionField = highlights.performance.find((h) => h.field === 'consumo.rodoviario');
    const bestConsumptionCar = consumptionField?.best || carNames[0];

    return {
      overall: `Analisamos ${carNames.length} veículos considerando preço, desempenho, eficiência e segurança. O ${winner} se destacou como a melhor opção geral no custo-benefício.`,

      priceAnalysis: `Em termos de preço, o ${bestPriceCar} é a opção mais acessível${priceDiff > 0 ? `, economizando cerca de R$ ${priceDiff.toLocaleString('pt-BR')} em relação ao ${worstPriceCar}` : ''}. Considere também IPVA e seguro anuais para calcular o custo real de propriedade.`,

      performanceAnalysis: `O ${bestPowerCar} lidera em potência${powerField ? ` com ${powerField.values[bestPowerCar]} cavalos` : ''}. Para quem busca um carro mais esportivo ou precisa de força para ultrapassagens, esta é a melhor escolha.`,

      efficiencyAnalysis: consumptionField.values[bestConsumptionCar] ? `Pensando em economia de combustível, o ${bestConsumptionCar} é o mais eficiente${consumptionField ? `, fazendo ${consumptionField.values[bestConsumptionCar]} km/l na estrada` : ''}. No longo prazo, isso representa economia significativa.` : `Pensando em economia de combustível, o ${bestConsumptionCar} é a mais eficiente.`,

      safetyAnalysis: this.generateSafetyAnalysis(carsData, highlights),

      finalVerdict:
        winner === bestPriceCar && winner === bestPowerCar
          ? `O ${winner} domina em quase todos os aspectos! É raro encontrar um veículo que une preço baixo e alto desempenho. Recomendação forte de compra.`
          : winner === bestPriceCar
            ? `O ${winner} oferece o melhor custo-benefício. Mesmo não sendo o mais potente, entrega tudo que a maioria dos motoristas precisa por um preço justo.`
            : `O ${winner} é a escolha mais equilibrada. Vale investir um pouco mais para ter um conjunto superior de características e melhor experiência de uso.`,
    };
  }

  private static compareCategory(
    carsData: Record<string, CarData>,
    fields: string[],
    direction: 'higher_better' | 'lower_better' | 'mixed',
    maxPoints: number,
  ): { scores: Record<string, number> } {
    const scores: Record<string, number> = {};
    const carNames = Object.keys(carsData);

    carNames.forEach((name) => (scores[name] = 0));

    fields.forEach((field, fieldIndex) => {
      const values = carNames
        .map((name) => ({
          name,
          value: this.getNestedValue(carsData[name], field),
        }))
        .filter(
          (item) => item.value !== null && item.value !== undefined && !isNaN(Number(item.value)),
        );

      if (values.length === 0) return;

      const isAcceleration = field.includes('aceleracao');
      const fieldDirection = isAcceleration ? 'lower_better' : direction;

      const sorted = [...values].sort((a, b) =>
        fieldDirection === 'higher_better' || fieldDirection === 'mixed'
          ? Number(b.value) - Number(a.value)
          : Number(a.value) - Number(b.value),
      );

      const pointsPerField = maxPoints / fields.length;
      sorted.forEach((item, index) => {
        const positionPoints = (sorted.length - index) / sorted.length;
        scores[item.name] += pointsPerField * positionPoints;
      });
    });

    return { scores };
  }

  private static formatCurrency = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  private static buildFieldComparisons(
    carsData: Record<string, CarData>,
    fieldConfigs: Array<{
      field: string;
      label: string;
      unit?: string;
      comparison: 'higher_better' | 'lower_better' | 'neutral';
    }>,
  ): FieldComparison[] {
    return fieldConfigs.map((config) => {
      const values: Record<string, any> = {};
      Object.entries(carsData).forEach(([name, data]) => {
        values[name] = this.getNestedValue(data, config.field);
      });

      const validValues = Object.entries(values).filter(([_, v]) => v !== null && v !== undefined);

      let best = '';
      let worst = '';
      let explanation = '';

      if (validValues.length > 0) {
        if (config.comparison === 'higher_better') {
          best = validValues.reduce(
            (max, [name, val]) => (values[max] === null || val > values[max] ? name : max),
            validValues[0][0],
          );
          worst = validValues.reduce(
            (min, [name, val]) => (values[min] === null || val < values[min] ? name : min),
            validValues[0][0],
          );
          explanation = `Quanto maior, melhor. O ${best} lidera com ${values[best]}${config.unit || ''}.`;
        } else if (config.comparison === 'lower_better') {
          best = validValues.reduce(
            (min, [name, val]) => (values[min] === null || val < values[min] ? name : min),
            validValues[0][0],
          );
          worst = validValues.reduce(
            (max, [name, val]) => (values[max] === null || val > values[max] ? name : max),
            validValues[0][0],
          );
          explanation = `Quanto menor, melhor. O ${best} é o mais econômico com ${this.formatCurrency(values[best])}.`;
        } else {
          explanation = `Informação técnica. Veja a tabela para comparar.`;
        }
      }

      return {
        field: config.field,
        label: config.label,
        unit: config.unit,
        values,
        best,
        worst,
        comparison: config.comparison,
        humanExplanation: explanation,
      };
    });
  }

  private static findBest(
    carsData: Record<string, CarData>,
    field: string,
    direction: 'higher' | 'lower',
  ): string {
    const carNames = Object.keys(carsData);
    const values = carNames
      .map((name) => ({
        name,
        value: this.getNestedValue(carsData[name], field),
      }))
      .filter((item) => item.value !== null && item.value !== undefined);

    if (values.length === 0) return carNames[0];

    return values.reduce((best, current) => {
      if (direction === 'higher') {
        return current.value > best.value ? current : best;
      } else {
        return current.value < best.value ? current : best;
      }
    }).name;
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}