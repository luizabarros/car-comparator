# Sistema de Comparação de Veículos com Processamento em Pipeline e Modelos de Linguagem

## Resumo

Este trabalho apresenta um sistema de comparação de veículos que utiliza **Modelos de Linguagem (LLMs)** e uma arquitetura em **pipeline sequencial orientado a lotes** para extrair, processar e analisar informações automotivas a partir de múltiplas fontes web. O sistema supera limitações do web scraping tradicional através de uma abordagem semântica resiliente, mantendo precisão factual com validação cruzada e cache distribuído.

## Arquitetura

### Pipeline Sequencial Orientado a Lotes
```
Input → ParseFilter → SearchFilter → URLProcessingFilter → LLMExtractionFilter → ComparisonFilter → Output
```

**Características da arquitetura:**
- **Batch-oriented**: Processamento sequencial de lotes de veículos
- **Centrally orchestrated**: Orquestração centralizada em `/api/search-analyze/route.ts`
- **Modular**: Filtros independentes e substituíveis
- **Resiliente**: Falha em um filtro não quebra o pipeline completo
- **Com timeout granular**: Controle por etapa evita travamentos

### Filtros Implementados

1. **ParseFilter**: Valida e normaliza entrada do usuário
2. **SearchFilter**: Busca URLs via SerpAPI (Google Search)
3. **URLProcessingFilter**: Categoriza resultados (orgânico, Reclame Aqui, imagens, concessionárias)
4. **LLMExtractionFilter**: Extração estruturada via OpenAI GPT-4.1 com busca web integrada
5. **ComparisonFilter**: Geração de comparação via template estático

## Método de Extração de Dados

### Abordagem Híbrida: LLM + Busca Web

O sistema utiliza uma estratégia de **chunking especializado** com três prompts independentes:

1. **Chunk Técnico**: Especificações mecânicas e dimensionais
2. **Chunk Features**: Equipamentos e características de conforto
3. **Chunk Análise**: Avaliações de segurança, reclamações e análise preditiva

**Inovação**: Busca web automática para campos críticos ausentes:
- Sistema detecta campos como IPVA, seguro, crash test
- Busca ativamente na internet usando web_search do GPT-4.1
- Completude de dados aumenta de ~60% para ~95%

### Formulação dos Prompts

Cada chunk utiliza:
- **JSON Schema estrito** para estruturação da saída
- **Instruções específicas** para cada domínio
- **Validação cruzada** entre fontes
- **Fallback obrigatório** para busca web quando dados não encontrados

## Otimizações Implementadas

### 1. Cache Distribuído com Redis
```typescript
// Cache por 24 horas de:
- Extrações LLM: `openai_extract:${carModel}:${year}:${urlHash}`
- Buscas SerpAPI: `serpapi_search:${carModel}:${year}`
- Imagens e concessionárias
```

### 2. Template Estático para Geração de HTML
**Problema identificado**: Geração de HTML via LLM consumia ~45s
**Solução**: Template Handlebars estático (~50ms)
**Resultado**: Redução de 99,9% no tempo de geração

### 3. Paralelismo por Chunk
```typescript
// Extração simultânea de três chunks
const [tecnicoData, featuresData, analiseData] = await Promise.all([
  openai.responses.create({ /* chunk técnico */ }),
  openai.responses.create({ /* chunk features */ }),
  openai.responses.create({ /* chunk análise */ })
]);
```

### 4. Rate Limiting por IP
- 10 requisições por minuto por IP
- Prevenção de abuso e garantia de disponibilidade

## Algoritmo de Comparação

### Modelo de Pontuação Multidimensional
```typescript
scores[name] = 
  priceComparison(25%) +      // Preço, IPVA, seguro (menor melhor)
  performanceComparison(25%) + // Potência, torque, aceleração
  efficiencyComparison(25%) +  // Consumo urbano/rodoviário
  safetyComparison(25%)        // NCAP adultos/crianças/pedestres
```

### Análise em Linguagem Natural
Geração automática de:
- **Visão geral** comparativa
- **Análise por categoria** (preço, desempenho, economia, segurança)
- **Veredito final** com recomendação contextualizada

## Dados Estruturados

### Schema de Dados (TypeScript)
```typescript
interface CarData {
  informacoes_gerais: { /* 8 campos */ };
  motor: { /* 6 campos */ };
  transmissao: { /* 4 campos */ };
  suspensao: { /* 3 campos */ };
  // ... total de ~60 campos estruturados
}
```

### Fontes de Dados Integradas
1. **Fichas técnicas**: Sites automotivos especializados
2. **Reclame Aqui**: Reclamações de consumidores
3. **Latin NCAP/Euro NCAP**: Avaliações de segurança
4. **Concessionárias**: Informações de vendas e assistência
5. **FIPE**: Histórico de preços e depreciação

## Stack Tecnológica

### Backend (Next.js API Routes)
- **Next.js 14**: API Routes com App Router
- **TypeScript**: Tipagem estática e interfaces
- **Redis**: Cache distribuído (redis)
- **OpenAI GPT-4.1**: Extração semântica com web_search
- **SerpAPI**: Busca no Google com categorização

### Frontend (React 18)
- **Tailwind CSS**: Estilização utilitária
- **Chart.js**: Gráficos de histórico de preços
- **Framer Motion**: Animações
- **Lucide React**: Ícones

## Contribuições Técnicas

### 1. Resiliência sobre Precisão
> "A imprecisão observada não decorre do modelo de linguagem, mas da natureza genérica da camada de recuperação."

### 2. Chunking Especializado
> "A unificação reduziria chamadas, mas aumentaria alucinação. A escolha por chunks prioriza corretude e auditabilidade."

### 3. Otimização Baseada em Perfil
> "Identificou-se que uma boa parte do código consumia a maior parte da latência, caracterizando oportunidade clara de otimização (Lei de Pareto)."

### 4. Arquitetura Híbrida
> "Em cenários com múltiplas fontes heterogêneas e estrutura instável, o uso de modelos de linguagem mostrou-se mais robusto que scraping tradicional."

## Limitações e Trabalhos Futuros

### Limitações Atuais
1. **Latência dominada por LLM**: ~30s por veículo (inferência GPT-4.1)
2. **Custos operacionais**: OpenAI + SerpAPI (~$0.30 por comparação)
3. **Dependência de APIs externas**: Disponibilidade não garantida

### Melhorias Propostas
1. **Fine-tuning de modelo específico** para domínio automotivo
2. **Crawler próprio** para reduzir dependência do SerpAPI
3. **Modelo local** (Llama 3.1) para casos de uso específicos (não é adequado, pois precisa de GPU)
4. **Sistema de feedback** para correção iterativa de extrações

## Conclusão

O sistema demonstra a viabilidade de usar LLMs para extração de informação em domínios complexos, combinando resiliência semântica com validação factual. A arquitetura em pipeline permite isolamento de falhas e otimizações incrementais, enquanto o chunking especializado equilibra precisão e custos computacionais.

# Referências
- FIELDING, R. T. **Architectural Styles and the Design of Network-based Software Architectures**. Doctoral dissertation, University of California, Irvine, 2000.

GARLAN, David; SHAW, Mary.
An Introduction to Software Architecture.
Advances in Software Engineering and Knowledge Engineering, 1993.

A batch-oriented, sequential processing pipeline with centralized orchestration, inspired by the Pipes-and-Filters decomposition but not conforming to the Pipe-and-Filter architectural style as defined by Garlan & Shaw and Fielding.

https://www.fca.org.uk/publication/research/price-comparison-website-consumer-research.pdf

https://publications.anl.gov/anlpubs/2021/05/167399.pdf

https://www.researchgate.net/publication/367719780_Web_Scraping_Techniques_and_Applications_A_Literature_Review

https://www.researchgate.net/publication/258099336_Scraping_the_Social_Issues_in_Live_Research

https://arxiv.org/pdf/2307.06435

[2310.03003] From Words to Watts: Benchmarking the Energy Costs of Large Language Model Inference

A Survey on Hardware Accelerators for Large Language Models

A Study Of LLMs On Multiple AI Accelerators And GPUs With A Performance Evaluation

---

**Palavras-chave**: LLM, extração de informação, pipeline batch, comparação de veículos, arquitetura de filtros, otimização de desempenho, cache distribuído.
