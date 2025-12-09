'use client';

import { useState } from 'react';
import {
  Container,
  Heading,
  VStack,
  SimpleGrid,
  useToast,
  Box,
  Text
} from '@chakra-ui/react';
import SearchForm from './components/SearchForm';
import { CarData } from '../types/car';

export default function Home() {
  const [searchResults, setSearchResults] = useState<CarData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSearch = async (carModel: string, year?: number) => {
    setIsLoading(true);
    setSearchResults([]);

    try {
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carModel, year })
      });

      const searchData = await searchResponse.json();
      
      if (!searchData.results || searchData.results.length === 0) {
        toast({
          title: 'Nenhum resultado encontrado',
          status: 'info',
          duration: 3000,
        });
        return;
      }

      const analysisResults: CarData[] = [];
      
      for (const result of searchData.results.slice(0, 3)) { // Limit to 3 URLs
        try {
          const scrapeResponse = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: result.link })
          });

          const scrapeData = await scrapeResponse.json();
          
          if (scrapeData.success) {
            // Analyze with LLM
            const analyzeResponse = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                content: scrapeData.content,
                carModel 
              })
            });

            const analyzeData = await analyzeResponse.json();
            analysisResults.push(analyzeData.analysis);
          }
        } catch (error) {
          console.error(`Error processing ${result.link}:`, error);
        }
      }

      setSearchResults(analysisResults);
      
      toast({
        title: 'Busca concluída',
        description: `Encontrados ${analysisResults.length} veículos analisados`,
        status: 'success',
        duration: 3000,
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Erro na busca',
        description: 'Ocorreu um erro ao buscar os veículos',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8}>
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={4}>
            Consultor de Veículos Inteligente
          </Heading>
          <Text fontSize="xl" color="gray.600">
            Encontre o carro perfeito com análise de IA
          </Text>
        </Box>

        <SearchForm onSearch={handleSearch} isLoading={isLoading} />

        {searchResults.length > 0 && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} width="full">
            {/* {searchResults.map((car, index) => (
              <CarCard key={index} carData={car} />
            ))} */}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
}