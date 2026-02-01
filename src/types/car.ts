export interface CarData {
  informacoes_gerais: {
    fabricante: string | null;
    modelo: string;
    ano: number | null;
    versao: string | null;
    preco: number | null;
    garantia: string | null;
    ipva: number | null;
    seguro: number | null;
  };

  motor: {
    propulsao: string | null; // "Dianteira", "Traseira", "4x4"
    combustivel: string | null; // "Gasolina", "Flex", "Diesel", "Elétrico", "Híbrido"
    cilindros: string | null; // "4 em linha", "V6", "V8"
    cilindrada: string | null; // "1.0", "2.0 turbo"
    potencia_maxima: number | null; // cv
    torque_maximo: number | null; // kgfm
  };

  transmissao: {
    cambio: string | null; // "Manual", "Automático", "CVT", "Automatizado"
    marchas: string | null; // "5", "6", "7"
    tracao: string | null; // "Dianteira", "Traseira", "Integral"
    acoplamento: string | null; // "Embreagem", "Conversor de torque"
  };

  suspensao: {
    dianteira: string | null; // "McPherson", "Duplo A"
    traseira: string | null; // "Eixo de torção", "Multilink"
    elemento_elastico: string | null; // "Molas helicoidais"
  };

  freios: {
    dianteiros: string | null; // "Disco ventilado", "Disco sólido"
    traseiros: string | null; // "Disco", "Tambor"
  };

  direcao: {
    tipo: string | null; // "Elétrica", "Hidráulica", "Eletro-hidráulica"
  };

  pneus: {
    dianteiros: string | null; // "205/55 R16"
    traseiros: string | null; // "205/55 R16"
    estepe: string | null; // "Estepe fino", "Temporário", "Full size"
  };

  dimensoes: {
    comprimento: number | null; // mm
    largura: number | null; // mm
    altura: number | null; // mm
    dist_entre_eixos: number | null; // mm
    porta_malas: number | null; // litros
    peso: number | null; // kg
  };

  desempenho: {
    velocidade_max: number | null; // km/h
    aceleracao_0_100: number | null; // segundos
    frenagem_100_0: number | null; // metros
  };

  consumo: {
    urbano: number | null; // km/l
    rodoviario: number | null; // km/l
    eletrico: number | null; // km/kWh (para elétricos/híbridos)
  };

  autonomia: {
    urbana: number | null; // km
    rodoviaria: number | null; // km
    eletrica: number | null; // km (para elétricos/híbridos)
  };

  avaliacao: {
    ncap: number | null; // 0-5 estrelas
    protecao_adultos: number | null; // 0-100%
    protecao_criancas: number | null; // 0-100%
    protecao_pedestres: number | null; // 0-100%
    assistencia: number | null; // 0-100%
    concessionarias: number | null; // Avaliação das concessionárias 0-5
  };

  historico_depreciacao: Array<{
    ano: number;
    preco: number; // R$
  }>;

  analise_ia: {
    custo_total_propriedade: number | null; // R$ anual (IPVA + seguro + manutenção)
    liquidez: 'alta' | 'media' | 'baixa' | null; // Facilidade de revenda
    risco_manutencao: string | null; // Análise de confiabilidade e custos
    comparacao_preditiva: string | null; // Tendências de mercado
    satisfacao_proprietarios: string | null; // Resumo de reviews
  };

  reclamacoes: Array<{
    titulo: string;
    data: string; // "DD/MM/AAAA"
    descricao: string;
    link: string; // URL completa
  }>;

  reclamacoes_resumo: string | null; // Resumo geral do veredito

  concessionarias_proximas: Array<{
    nome: string;
    cidade: string;
    site: string | null;
    contato: string; // Telefone ou email
  }>;

  // Metadados (opcional)
  metadata?: {
    sources: string[]; // URLs utilizadas
    extractedAt: string; // ISO timestamp
    model: string; // Modelo de IA usado
    failed?: boolean; // Se houve erro na extração
  };

  // Erro (opcional)
  error?: string;
}

export interface SearchResult {
  position?: number;
  title: string;
  link: string;
  snippet: string;
  imageUrl?: string;
  source?: string;
  date?: string;
  type?: 'image' | 'local' | 'organic' | 'review';
  rating?: number;
  phone?: string;
  address?: string;
  hours?: string;
}

export interface SearchFilterResult {
  carModel: string;
  year?: number;
  originalInput: string;
  searchResults: any[];
}

export interface APIResponse {
  success: boolean;
  totalVehicles: number;
  analyzedVehicles: number;
  data: Record<string, CarData>;
  comparisonHTML: string;
  error?: string;
  details?: string;
}

export interface CarItem {
  carModel: string;
  year?: number;
  originalInput: string;
}

export interface SearchResult {
  carModel: string;
  year?: number;
  originalInput: string;
  searchResults: any[];
}

export interface ProcessedURLs {
  carModel: string;
  year?: number;
  originalInput: string;
  organicUrls: string[];
  reclameAquiResults: any[];
  imageResults: any[];
  dealershipResults: any[];
  allSearchResults: any[];
}

export interface AnalyzedCar {
  carModel: string;
  year?: number;
  originalInput: string;
  data: CarData | null;
  error?: string;
}

export interface ComparisonResult {
  winner: string;
  scores: Record<string, CategoryScore>;
  recommendations: {
    bestPrice: string;
    bestPerformance: string;
    bestEfficiency: string;
    bestSafety: string;
    bestOverall: string;
  };
  highlights: Record<string, FieldComparison[]>;
  humanAnalysis: {
    overall: string;
    priceAnalysis: string;
    performanceAnalysis: string;
    efficiencyAnalysis: string;
    safetyAnalysis: string;
    finalVerdict: string;
  };
}

export interface CategoryScore {
  carName: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface FieldComparison {
  field: string;
  label: string;
  unit?: string;
  values: Record<string, any>;
  best: string;
  worst: string;
  comparison: 'higher_better' | 'lower_better' | 'neutral';
  humanExplanation: string;
}
