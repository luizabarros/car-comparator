export interface CarData {
  informacoes_gerais: {
    ano: number;
    preco: number;
    desvalorizacao?: string;
    propulsao?: string;
    combustivel: string;
    ipva?: number;
    seguro?: number;
    revisoes?: string;
    procedencia?: string;
    garantia?: string;
    configuracao?: string;
    porte?: string;
    lugares: number;
    portas: number;
    plataforma?: string;
    nota_leitor?: number;
    indice_cnw?: number;
    protecao_adulto?: number;
    protecao_infantil?: number;
    ranking_cnw?: number;
  };
  motor: {
    instalacao?: string;
    aspiracao?: string;
    disposicao?: string;
    alimentacao?: string;
    cilindros?: number;
    comando_valvulas?: string;
    cilindrada_unitária?: number;
    acionamento_comando?: string;
    valvulas_por_cilindro?: number;
    diametro_cilindro?: number;
    razao_compressao?: number;
    curso_pistao?: number;
    deslocamento?: number;
    potencia_maxima?: string;
    codigo_motor?: string;
    torque_maximo?: string;
    peso_potencia?: number;
    torque_especifico?: number;
    peso_torque?: number;
    potencia_especifica?: number;
    viscosidade_oleo?: string;
  };
  transmissao: {
    tracao?: string;
    cambio?: string;
    codigo_cambio?: string;
    acoplamento?: string;
  };
  suspensao: {
    dianteira?: string;
    elemento_elastico_dianteira?: string;
    traseira?: string;
    elemento_elastico_traseira?: string;
  };
  freios: {
    dianteiros?: string;
    traseiros?: string;
  };
  direcao: {
    assistencia?: string;
    diametro_giro?: number;
  };
  pneus: {
    dianteiros?: string;
    altura_flanco_dianteiros?: number;
    traseiros?: string;
    altura_flanco_traseiros?: number;
    estepe?: string;
  };
  dimensoes: {
    comprimento: number;
    largura: number;
    distancia_entre_eixos: number;
    altura: number;
    porta_malas: number;
    tanque_combustivel: number;
    peso: number;
    carga_util?: number;
  };
  desempenho: {
    velocidade_maxima?: number;
    aceleracao_0_100?: number;
  };
  consumo: {
    urbano: number;
    rodoviario: number;
  };
  autonomia: {
    urbana: number;
    rodoviaria: number;
  };
  analise_ia?: {
    custo_total_propriedade?: number;
    liquidez?: string;
    risco_manutencao?: string;
    match_estilo_vida?: string[];
    comparacao_preditiva?: string;
  };
}