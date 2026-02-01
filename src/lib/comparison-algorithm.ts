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

    const safetyComparison = this.compareCategory(
      carsData,
      ['avaliacao.protecao_adultos', 'avaliacao.protecao_criancas', 'avaliacao.protecao_pedestres'],
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
        bestSafety: this.findBest(carsData, 'avaliacao.protecao_adultos', 'higher'),
        bestOverall: winner,
      },
      highlights,
      humanAnalysis: this.generateHumanAnalysis(carsData, highlights, winner),
    };
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

    const safetyField = highlights.safety.find((h) => h.field === 'avaliacao.protecao_adultos');
    const bestSafetyCar = safetyField?.best || carNames[0];

    return {
      overall: `Analisamos ${carNames.length} veículos considerando preço, desempenho, eficiência e segurança. O ${winner} se destacou como a melhor opção geral no custo-benefício.`,

      priceAnalysis: `Em termos de preço, o ${bestPriceCar} é a opção mais acessível${priceDiff > 0 ? `, economizando cerca de R$ ${priceDiff.toLocaleString('pt-BR')} em relação ao ${worstPriceCar}` : ''}. Considere também IPVA e seguro anuais para calcular o custo real de propriedade.`,

      performanceAnalysis: `O ${bestPowerCar} lidera em potência${powerField ? ` com ${powerField.values[bestPowerCar]} cavalos` : ''}. Para quem busca um carro mais esportivo ou precisa de força para ultrapassagens, esta é a melhor escolha.`,

      efficiencyAnalysis: `Pensando em economia de combustível, o ${bestConsumptionCar} é o mais eficiente${consumptionField ? `, fazendo ${consumptionField.values[bestConsumptionCar]} km/l na estrada` : ''}. No longo prazo, isso representa economia significativa.`,

      safetyAnalysis: `Em segurança, o ${bestSafetyCar} tem as melhores avaliações${safetyField && safetyField.values[bestSafetyCar] ? ` com ${safetyField.values[bestSafetyCar]} estrelas` : ''}. Para famílias, este é um fator crucial na decisão.`,

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
          explanation = `Quanto menor, melhor. O ${best} é o mais econômico com ${values[best]}${config.unit || ''}.`;
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
