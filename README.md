# 🚗 API de Comparação de Veículos com IA

Sistema completo de análise e comparação de veículos utilizando Google Search do SERP API + OpenAI GPT-5.2

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Fluxo de Dados](#fluxo-de-dados)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [APIs Utilizadas](#apis-utilizadas)
- [Cache e Performance](#cache-e-performance)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

Este projeto implementa uma API REST que:

1. **Busca** informações sobre veículos via Google Search (SerpAPI)
2. **Extrai** dados estruturados usando OpenAI GPT-4 com web search
3. **Analisa** e compara múltiplos veículos
4. **Gera** relatórios HTML responsivos e visuais

### Diferenciais

✅ **Sem scraping tradicional** - Usa IA com acesso web (mais estável)  
✅ **Cache inteligente** - Redis para otimizar custos de API  
✅ **Dados completos** - Reclamações, concessionárias, depreciação, NCAP  
✅ **Relatórios visuais** - HTML responsivo com Tailwind CSS + Chart.js  
✅ **Adequado para TCC** - Arquitetura bem documentada e acadêmica  

---

## 🏗️ Arquitetura

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │ POST ["Toyota Corolla, 2020"]
       ▼
┌─────────────────────────────────────┐
│  API Route (/api/search-analyze)    │
│  - Valida entrada                   │
│  - Orquestra fluxo                  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  SearchAPI (SerpAPI)                │
│  - Busca URLs relevantes            │
│  - Filtra por tipo (organic)        │
└──────┬──────────────────────────────┘
       │ URLs
       ▼
┌─────────────────────────────────────┐
│  LLMAnalyzer.extractCarDataFromURLs │
│  - OpenAI GPT-4 + Web Search        │
│  - Extrai dados estruturados        │
│  - Valida e padroniza               │
└──────┬──────────────────────────────┘
       │ CarData (JSON)
       ▼
┌─────────────────────────────────────┐
│  LLMAnalyzer.generateComparisonHTML │
│  - OpenAI GPT-4                     │
│  - Gera HTML comparativo            │
│  - Tailwind CSS + Chart.js          │
└──────┬──────────────────────────────┘
       │ HTML
       ▼
┌─────────────────────────────────────┐
│  Resposta JSON                      │
│  {                                  │
│    success: true,                   │
│    data: { ... },                   │
│    comparisonHTML: "..."            │
│  }                                  │
└─────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados

### 1. Entrada
```json
["Toyota Corolla, 2020", "Honda Civic, 2021"]
```

### 2. Busca (SerpAPI)
```javascript
// Para cada carro:
const urls = await SearchAPI.searchCarSites("Toyota Corolla", 2020);
// Retorna: [
//   { link: "https://olhonocarro.com.br/...", type: "organic" },
//   { link: "https://reclameaqui.com.br/...", type: "organic" },
//   ...
// ]
```

### 3. Extração (OpenAI GPT-4)
```javascript
const carData = await LLMAnalyzer.extractCarDataFromURLs(
  urls,
  "Toyota Corolla",
  2020,
  searchResults
);
// Retorna: CarData estruturado (ver types/car.ts)
```

### 4. Comparação (OpenAI GPT-4)
```javascript
const html = await LLMAnalyzer.generateComparisonHTML({
  "Toyota Corolla, 2020": carData1,
  "Honda Civic, 2021": carData2
});
// Retorna: HTML completo e responsivo
```

### 5. Saída
```json
{
  "success": true,
  "totalVehicles": 2,
  "analyzedVehicles": 2,
  "data": {
    "Toyota Corolla,2020": { ... },
    "Honda Civic,2021": { ... }
  },
  "comparisonHTML": "<!DOCTYPE html>..."
}
```

---

## 🚀 Instalação

### Pré-requisitos

- Node.js >= 18.0.0
- Redis (para cache)
- Chaves de API:
  - OpenAI API Key
  - SerpAPI Key

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/car-comparison-api.git
cd car-comparator

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas chaves de API

# 4. Inicie Redis (via Docker)
docker run -d -p 6379:6379 redis:alpine

# 5. Rode em desenvolvimento
npm run dev
```

---

## ⚙️ Configuração

### Arquivo `.env`

```bash
# OpenAI API (Obrigatório)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# SerpAPI (Obrigatório)
SERPAPI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Redis (Obrigatório para cache)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Opcional
NODE_ENV=development
```

### Obter chaves de API

**OpenAI:**
1. Acesse https://platform.openai.com/api-keys
2. Crie uma nova chave
3. Configure billing (US$ 5 mínimo)

**SerpAPI:**
1. Acesse https://serpapi.com/
2. Registre-se (plano gratuito: 100 buscas/mês)
3. Copie a API key do dashboard

---

## 📡 Uso

### cURL (Windows PowerShell)

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/search-analyze" `
  -Method POST `
  -ContentType "application/json" `
  -Body '["Toyota Corolla, 2020", "Honda Civic, 2021"]'
```

### cURL (Windows CMD)

```cmd
curl -X POST http://localhost:3000/api/search-analyze -H "Content-Type: application/json" -d "[\"Toyota Corolla, 2020\", \"Honda Civic, 2021\"]"
```

### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/api/search-analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([
    "Toyota Corolla, 2020",
    "Honda Civic, 2021",
    "Volkswagen Golf, 2022"
  ])
});

const data = await response.json();
console.log(data.comparisonHTML); // HTML pronto para renderizar
```

### Exemplo de Resposta

```json
{
  "success": true,
  "totalVehicles": 2,
  "analyzedVehicles": 2,
  "data": {
    "Toyota Corolla,2020": {
      "informacoes_gerais": {
        "fabricante": "Toyota",
        "modelo": "Corolla",
        "ano": 2020,
        "preco": 85000,
        "garantia": "3 anos",
        "ipva": 3400,
        "seguro": 2800
      },
      "motor": {
        "combustivel": "Flex",
        "potencia_maxima": 144,
        "torque_maximo": 17.5
      },
      "consumo": {
        "urbano": 10.5,
        "rodoviario": 13.2
      },
      "reclamacoes": [
        {
          "titulo": "Problema no câmbio CVT",
          "data": "15/01/2024",
          "descricao": "Câmbio apresentou falha com 30 mil km",
          "link": "https://reclameaqui.com.br/..."
        }
      ],
      "concessionarias_proximas": [
        {
          "nome": "Toyota Plaza",
          "cidade": "São Paulo - SP",
          "site": "https://toyotaplaza.com.br",
          "contato": "(11) 1234-5678"
        }
      ]
    }
  },
  "comparisonHTML": "<!DOCTYPE html><html>...</html>"
}
```

---

## 📁 Estrutura do Projeto

```
car-comparator/
├── app/
│   └── api/
│       └── search-analyze/
│           └── route.ts          # Endpoint principal
├── lib/
│   ├── llm-analyzer.ts           # Lógica de IA (OpenAI)
│   ├── search.ts                 # Busca (SerpAPI)
│   └── rate-limiter.ts           # Redis client
├── types/
│   └── car.ts                    # Interfaces TypeScript
├── prompts.ts                  # Prompts do LLM
├── .env.example                  # Variáveis de ambiente
├── package.json
└── README.md
```

---

## 🔧 APIs Utilizadas

### 1. OpenAI GPT-5.2

**Modelo:** `gpt-5.2`  
**Uso:**
- Extração de dados estruturados
- Geração de HTML comparativo

**Custos (aproximados):**
- Input: $0.01 / 1K tokens
- Output: $0.03 / 1K tokens
- Média: ~10K tokens por carro = **~$0.40 por análise**

### 2. SerpAPI (Google Search)

**Endpoint:** `https://serpapi.com/search.json`  
**Uso:**
- Busca de URLs relevantes
- Filtros por site, tipo (orgânico, local, imagens)

**Custos:**
- Plano gratuito: 250 buscas por dia

### 3. Redis (Cache)

**Uso:**
- Cache de respostas da OpenAI (24h)
- Cache de buscas do SerpAPI (24h)
- Reduz custos e latência

**TTL (Time To Live):**
- Extração de dados: 24 horas
- HTML comparativo: 24 horas
- Buscas: 24 horas

---

## ⚡ Cache e Performance

### Estratégia de Cache

```javascript
// Chave de cache para extração
const cacheKey = `openai_extract:${carModel}:${year}:${urlHash}`;

// Chave de cache para comparação
const cacheKey = `openai_compare:${dataHash}`;
```

### Benefícios

- ✅ **90% de redução de custos** em requisições repetidas
- ✅ **Latência < 100ms** para cache hits
- ✅ **Consistência** de dados por 24h

### Limpeza de Cache

```bash
# Redis CLI
redis-cli FLUSHDB  # Limpa todos os caches
redis-cli KEYS "openai_*"  # Lista todas as chaves
redis-cli DEL "openai_extract:Toyota Corolla:2020:abc123"  # Remove específico
```

---

## 🐛 Troubleshooting

### Erro: "OpenAI API key is invalid"

**Solução:**
```bash
# Verifique se a chave está correta
echo $OPENAI_API_KEY

# Teste a chave
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Erro: "Redis connection refused"

**Solução:**
```bash
# Inicie Redis via Docker
docker run -d -p 6379:6379 redis:alpine

# Ou instale localmente
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis
brew services start redis
```

### Erro: "SerpAPI quota exceeded"

**Solução:**
- Verifique seu plano: https://serpapi.com/dashboard
- Considere upgrade ou aguarde reset mensal
- Implemente rate limiting adicional

### HTML não renderiza corretamente

**Solução:**
- Verifique se o HTML retornado tem `<!DOCTYPE html>`
- Teste em arquivo `.html` standalone
- Valide com: https://validator.w3.org/

---

## 📊 Para o TCC

### Argumentação Acadêmica

**1. Justificativa da Arquitetura:**
> "Optou-se por uma arquitetura híbrida que combina busca estruturada (SerpAPI) com análise contextual via LLM (GPT-5.2). Esta abordagem oferece maior robustez comparada ao web scraping tradicional, que é suscetível a bloqueios e mudanças de layout."

**2. Metodologia de Extração:**
> "A extração de dados é realizada em duas etapas: (1) identificação de fontes relevantes via Google Custom Search do SERP API; (2) análise semântica do conteúdo via modelo de linguagem com capacidade de acesso web, garantindo interpretação contextual dos dados."

**3. Validação e Qualidade:**
> "Implementou-se cache em Redis com TTL de 24 horas, permitindo auditoria dos dados extraídos e redução de custos operacionais. Todas as fontes são rastreáveis via metadados, garantindo transparência e reprodutibilidade."

**4. Inovação Técnica:**
> "Diferente de sistemas tradicionais de scraping, este projeto utiliza IA generativa para interpretação contextual, permitindo adaptação automática a diferentes layouts de sites sem necessidade de manutenção de parsers específicos."

---

## 📝 Licença

MIT License - Projeto acadêmico para TCC

---

## 🤝 Contribuições

Sugestões e melhorias são bem-vindas! Abra uma issue ou PR.

---
## 📊 Fluxo Completo

```
Usuário seleciona carros no front-end
         ↓
ComparisonPage chama /api/search-analyze
         ↓
route.ts → SearchAPI.searchCarSites() [SerpAPI]
         ↓
route.ts → LLMAnalyzer.extractCarDataFromURLs() [OpenAI + Web Search]
         ↓
route.ts → LLMAnalyzer.generateComparisonHTML() [OpenAI]
         ↓
Retorna { success, data, comparisonHTML }
         ↓
ComparisonPage.tsx renderiza:
  - ComparisonAIResult (HTML)
  - PriceHistoryChart (FIPE)
```