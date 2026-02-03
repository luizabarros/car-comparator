export const carDataSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    informacoes_gerais: {
      type: 'object',
      additionalProperties: false,
      properties: {
        fabricante: { type: ['string', 'null'] },
        modelo: { type: 'string' },
        ano: { type: ['number', 'null'] },
        versao: { type: ['string', 'null'] },
        preco: { type: ['number', 'null'] },
        garantia: { type: ['string', 'null'] },
        ipva: { type: ['number', 'null'] },
        seguro: { type: ['number', 'null'] },
      },
      required: ['fabricante', 'modelo', 'ano', 'versao', 'preco', 'garantia', 'ipva', 'seguro'],
    },

    motor: {
      type: 'object',
      additionalProperties: false,
      properties: {
        propulsao: { type: ['string', 'null'] },
        combustivel: { type: ['string', 'null'] },
        cilindros: { type: ['string', 'null'] },
        cilindrada: { type: ['string', 'null'] },
        potencia_maxima: { type: ['number', 'null'] },
        torque_maximo: { type: ['number', 'null'] },
      },
      required: [
        'propulsao',
        'combustivel',
        'cilindros',
        'cilindrada',
        'potencia_maxima',
        'torque_maximo',
      ],
    },

    transmissao: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cambio: { type: ['string', 'null'] },
        marchas: { type: ['string', 'null'] },
        tracao: { type: ['string', 'null'] },
        acoplamento: { type: ['string', 'null'] },
      },
      required: ['cambio', 'marchas', 'tracao', 'acoplamento'],
    },

    suspensao: {
      type: 'object',
      additionalProperties: false,
      properties: {
        dianteira: { type: ['string', 'null'] },
        traseira: { type: ['string', 'null'] },
        elemento_elastico: { type: ['string', 'null'] },
      },
      required: ['dianteira', 'traseira', 'elemento_elastico'],
    },

    freios: {
      type: 'object',
      additionalProperties: false,
      properties: {
        dianteiros: { type: ['string', 'null'] },
        traseiros: { type: ['string', 'null'] },
      },
      required: ['dianteiros', 'traseiros'],
    },

    direcao: {
      type: 'object',
      additionalProperties: false,
      properties: {
        tipo: { type: ['string', 'null'] },
      },
      required: ['tipo'],
    },

    pneus: {
      type: 'object',
      additionalProperties: false,
      properties: {
        dianteiros: { type: ['string', 'null'] },
        traseiros: { type: ['string', 'null'] },
        estepe: { type: ['string', 'null'] },
      },
      required: ['dianteiros', 'traseiros', 'estepe'],
    },

    dimensoes: {
      type: 'object',
      additionalProperties: false,
      properties: {
        comprimento: { type: ['number', 'null'] },
        largura: { type: ['number', 'null'] },
        altura: { type: ['number', 'null'] },
        dist_entre_eixos: { type: ['number', 'null'] },
        porta_malas: { type: ['number', 'null'] },
        peso: { type: ['number', 'null'] },
      },
      required: ['comprimento', 'largura', 'altura', 'dist_entre_eixos', 'porta_malas', 'peso'],
    },

    desempenho: {
      type: 'object',
      additionalProperties: false,
      properties: {
        velocidade_max: { type: ['number', 'null'] },
        aceleracao_0_100: { type: ['number', 'null'] },
        frenagem_100_0: { type: ['number', 'null'] },
      },
      required: ['velocidade_max', 'aceleracao_0_100', 'frenagem_100_0'],
    },

    consumo: {
      type: 'object',
      additionalProperties: false,
      properties: {
        urbano: { type: ['number', 'null'] },
        rodoviario: { type: ['number', 'null'] },
        eletrico: { type: ['number', 'null'] },
      },
      required: ['urbano', 'rodoviario', 'eletrico'],
    },

    autonomia: {
      type: 'object',
      additionalProperties: false,
      properties: {
        urbana: { type: ['number', 'null'] },
        rodoviaria: { type: ['number', 'null'] },
        eletrica: { type: ['number', 'null'] },
      },
      required: ['urbana', 'rodoviaria', 'eletrica'],
    },

    conforto: {
      type: 'object',
      additionalProperties: false,
      properties: {
        ar_condicionado: { type: ['string', 'null'] },
        direcao_eletrica: { type: ['boolean', 'null'] },
        vidros_eletricos: { type: ['string', 'null'] },
        travas_eletricas: { type: ['boolean', 'null'] },
        banco_motorista_ajuste_altura: { type: ['boolean', 'null'] },
        volante_ajuste_altura: { type: ['boolean', 'null'] },
        volante_ajuste_profundidade: { type: ['boolean', 'null'] },
        volante_multifuncional: { type: ['boolean', 'null'] },
        computador_bordo: { type: ['boolean', 'null'] },
        controle_cruzeiro: { type: ['boolean', 'null'] },
        sensor_chuva: { type: ['boolean', 'null'] },
        sensor_crepuscular: { type: ['boolean', 'null'] },
        retrovisor_fotocromatico: { type: ['boolean', 'null'] },
        banco_couro: { type: ['boolean', 'null'] },
        bancos_aquecidos: { type: ['boolean', 'null'] },
        bancos_ventilados: { type: ['boolean', 'null'] },
      },
      required: [
        'ar_condicionado',
        'direcao_eletrica',
        'vidros_eletricos',
        'travas_eletricas',
        'banco_motorista_ajuste_altura',
        'volante_ajuste_altura',
        'volante_ajuste_profundidade',
        'volante_multifuncional',
        'computador_bordo',
        'controle_cruzeiro',
        'sensor_chuva',
        'sensor_crepuscular',
        'retrovisor_fotocromatico',
        'banco_couro',
        'bancos_aquecidos',
        'bancos_ventilados',
      ],
    },
    seguranca: {
      type: 'object',
      additionalProperties: false,
      properties: {
        airbags_motorista: { type: ['boolean', 'null'] },
        airbags_passageiro: { type: ['boolean', 'null'] },
        airbags_laterais: { type: ['boolean', 'null'] },
        airbags_cortina: { type: ['boolean', 'null'] },
        abs: { type: ['boolean', 'null'] },
        controle_tracao: { type: ['boolean', 'null'] },
        controle_estabilidade: { type: ['boolean', 'null'] },
        assistente_partida_rampa: { type: ['boolean', 'null'] },
        camera_re: { type: ['boolean', 'null'] },
        sensores_estacionamento_traseiro: { type: ['boolean', 'null'] },
        sensores_estacionamento_dianteiro: { type: ['boolean', 'null'] },
        alarme: { type: ['boolean', 'null'] },
        imobilizador: { type: ['boolean', 'null'] },
        controle_descida: { type: ['boolean', 'null'] },
        aviso_ponto_cego: { type: ['boolean', 'null'] },
        alerta_colisao_frontal: { type: ['boolean', 'null'] },
        frenagem_automatica_emergencia: { type: ['boolean', 'null'] },
        alerta_saida_faixa: { type: ['boolean', 'null'] },
      },
      required: [
        'airbags_motorista',
        'airbags_passageiro',
        'airbags_laterais',
        'airbags_cortina',
        'abs',
        'controle_tracao',
        'controle_estabilidade',
        'assistente_partida_rampa',
        'camera_re',
        'sensores_estacionamento_traseiro',
        'sensores_estacionamento_dianteiro',
        'alarme',
        'imobilizador',
        'controle_descida',
        'aviso_ponto_cego',
        'alerta_colisao_frontal',
        'frenagem_automatica_emergencia',
        'alerta_saida_faixa',
      ],
    },
    infotenimento: {
      type: 'object',
      additionalProperties: false,
      properties: {
        central_multimidia: { type: ['string', 'null'] },
        tela_touch: { type: ['boolean', 'null'] },
        tamanho_tela: { type: ['string', 'null'] },
        android_auto: { type: ['boolean', 'null'] },
        apple_carplay: { type: ['boolean', 'null'] },
        bluetooth: { type: ['boolean', 'null'] },
        usb: { type: ['boolean', 'null'] },
        comandos_volante: { type: ['boolean', 'null'] },
        sistema_som: { type: ['string', 'null'] },
        numero_alto_falantes: { type: ['number', 'null'] },
        navegacao_gps: { type: ['boolean', 'null'] },
      },
      required: [
        'central_multimidia',
        'tela_touch',
        'tamanho_tela',
        'android_auto',
        'apple_carplay',
        'bluetooth',
        'usb',
        'comandos_volante',
        'sistema_som',
        'numero_alto_falantes',
        'navegacao_gps',
      ],
    },

    avaliacao: {
      type: 'object',
      additionalProperties: false,
      properties: {
        ncap: { type: ['number', 'null'] },
        protecao_adultos: { type: ['number', 'null'] },
        protecao_criancas: { type: ['number', 'null'] },
        protecao_pedestres: { type: ['number', 'null'] },
        assistencia: { type: ['number', 'null'] },
      },
      required: [
        'ncap',
        'protecao_adultos',
        'protecao_criancas',
        'protecao_pedestres',
        'assistencia',
      ],
    },

    historico_depreciacao: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ano: { type: 'number' },
          preco: { type: 'number' },
        },
        required: ['ano', 'preco'],
      },
    },

    analise_ia: {
      type: 'object',
      additionalProperties: false,
      properties: {
        custo_total_propriedade: { type: ['number', 'null'] },
        liquidez: {
          type: ['string', 'null'],
          enum: ['alta', 'media', 'baixa', null],
        },
        risco_manutencao: { type: ['string', 'null'] },
        comparacao_preditiva: { type: ['string', 'null'] },
        satisfacao_proprietarios: { type: ['string', 'null'] },
      },
      required: [
        'custo_total_propriedade',
        'liquidez',
        'risco_manutencao',
        'comparacao_preditiva',
        'satisfacao_proprietarios',
      ],
    },

    imagens: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          imageUrl: { type: 'string' },
        },
        required: ['imageUrl'],
      },
    },

    reclamacoes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          titulo: { type: 'string' },
          data: { type: 'string' },
          descricao: { type: 'string' },
          link: { type: 'string' },
        },
        required: ['titulo', 'data', 'descricao', 'link'],
      },
    },

    reclamacoes_resumo: {
      type: ['string', 'null'],
    },

    concessionarias_proximas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          nome: { type: 'string' },
          cidade: { type: 'string' },
          site: { type: ['string', 'null'] },
          contato: { type: 'string' },
        },
        required: ['nome', 'cidade', 'site', 'contato'],
      },
    },
  },
  required: [
    'informacoes_gerais',
    'motor',
    'transmissao',
    'suspensao',
    'freios',
    'direcao',
    'pneus',
    'dimensoes',
    'desempenho',
    'consumo',
    'autonomia',
    'avaliacao',
    'historico_depreciacao',
    'analise_ia',
    'imagens',
    'reclamacoes',
    'reclamacoes_resumo',
    'concessionarias_proximas',
    'conforto',
    'seguranca',
    'infotenimento',
  ],
};

export const FIELDS_REQUIRING_WEB_SEARCH = [
  'custo_total_propriedade',
  'ipva',
  'seguro',
  'avaliacao',
];
