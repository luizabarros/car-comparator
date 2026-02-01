export const carDataSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    informacoes_gerais: {
      type: "object",
      additionalProperties: false,
      properties: {
        fabricante: { type: ["string", "null"] },
        modelo: { type: "string" },
        ano: { type: ["number", "null"] },
        versao: { type: ["string", "null"] },
        preco: { type: ["number", "null"] },
        garantia: { type: ["string", "null"] },
        ipva: { type: ["number", "null"] },
        seguro: { type: ["number", "null"] }
      }
    },

    motor: {
      type: "object",
      additionalProperties: false,
      properties: {
        propulsao: { type: ["string", "null"] },
        combustivel: { type: ["string", "null"] },
        cilindros: { type: ["string", "null"] },
        cilindrada: { type: ["string", "null"] },
        potencia_maxima: { type: ["number", "null"] },
        torque_maximo: { type: ["number", "null"] }
      }
    },

    transmissao: {
      type: "object",
      additionalProperties: false,
      properties: {
        cambio: { type: ["string", "null"] },
        marchas: { type: ["string", "null"] },
        tracao: { type: ["string", "null"] },
        acoplamento: { type: ["string", "null"] }
      }
    },

    suspensao: {
      type: "object",
      additionalProperties: false,
      properties: {
        dianteira: { type: ["string", "null"] },
        traseira: { type: ["string", "null"] },
        elemento_elastico: { type: ["string", "null"] }
      }
    },

    freios: {
      type: "object",
      additionalProperties: false,
      properties: {
        dianteiros: { type: ["string", "null"] },
        traseiros: { type: ["string", "null"] }
      }
    },

    direcao: {
      type: "object",
      additionalProperties: false,
      properties: {
        tipo: { type: ["string", "null"] }
      }
    },

    pneus: {
      type: "object",
      additionalProperties: false,
      properties: {
        dianteiros: { type: ["string", "null"] },
        traseiros: { type: ["string", "null"] },
        estepe: { type: ["string", "null"] }
      }
    },

    dimensoes: {
      type: "object",
      additionalProperties: false,
      properties: {
        comprimento: { type: ["number", "null"] },
        largura: { type: ["number", "null"] },
        altura: { type: ["number", "null"] },
        dist_entre_eixos: { type: ["number", "null"] },
        porta_malas: { type: ["number", "null"] },
        peso: { type: ["number", "null"] }
      }
    },

    desempenho: {
      type: "object",
      additionalProperties: false,
      properties: {
        velocidade_max: { type: ["number", "null"] },
        aceleracao_0_100: { type: ["number", "null"] },
        frenagem_100_0: { type: ["number", "null"] }
      }
    },

    consumo: {
      type: "object",
      additionalProperties: false,
      properties: {
        urbano: { type: ["number", "null"] },
        rodoviario: { type: ["number", "null"] },
        eletrico: { type: ["number", "null"] }
      }
    },

    autonomia: {
      type: "object",
      additionalProperties: false,
      properties: {
        urbana: { type: ["number", "null"] },
        rodoviaria: { type: ["number", "null"] },
        eletrica: { type: ["number", "null"] }
      }
    },

    avaliacao: {
      type: "object",
      additionalProperties: false,
      properties: {
        ncap: { type: ["number", "null"] },
        protecao_adultos: { type: ["number", "null"] },
        protecao_criancas: { type: ["number", "null"] },
        protecao_pedestres: { type: ["number", "null"] },
        assistencia: { type: ["number", "null"] },
        concessionarias: { type: ["number", "null"] }
      }
    },

    historico_depreciacao: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          ano: { type: "number" },
          preco: { type: "number" }
        }
      }
    },

    analise_ia: {
      type: "object",
      additionalProperties: false,
      properties: {
        custo_total_propriedade: { type: ["number", "null"] },
        liquidez: {
          type: ["string", "null"],
          enum: ["alta", "media", "baixa", null]
        },
        risco_manutencao: { type: ["string", "null"] },
        comparacao_preditiva: { type: ["string", "null"] },
        satisfacao_proprietarios: { type: ["string", "null"] }
      }
    },

    opinioes: {
      type: "object",
      additionalProperties: false,
      properties: {
        total: { type: ["number", "null"] },
        media: { type: ["number", "null"] }
      }
    },

    imagens: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          link: { type: "string" },
          imageUrl: { type: "string" }
        }
      }
    },

    reclamacoes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          titulo: { type: "string" },
          data: { type: "string" },
          descricao: { type: "string" },
          link: { type: "string" }
        }
      }
    },

    reclamacoes_resumo: {
      type: ["string", "null"]
    },

    concessionarias_proximas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          nome: { type: "string" },
          cidade: { type: "string" },
          site: { type: ["string", "null"] },
          contato: { type: "string" }
        }
      }
    }
  }
};
