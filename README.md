# Backend
docker-compose up -d

# No container OLLAMA
docker exec -it car-scraper-ollama-1 bash
ollama pull mistral

# Aplicação 
npm run dev