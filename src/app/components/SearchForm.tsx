'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast
} from '@chakra-ui/react';

interface SearchFormProps {
  onSearch: (carModel: string, year?: number) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [carModel, setCarModel] = useState('');
  const [year, setYear] = useState('');
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!carModel.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe o modelo do carro',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    onSearch(carModel.trim(), year ? parseInt(year) : undefined);
  };

  return (
    <Box as="form" onSubmit={handleSubmit} p={6} bg="white" borderRadius="lg" boxShadow="md">
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Modelo do Carro</FormLabel>
          <Input
            value={carModel}
            onChange={(e) => setCarModel(e.target.value)}
            placeholder="Ex: Honda Civic, Fiat Uno"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>Ano (opcional)</FormLabel>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Ex: 2020"
            min="1990"
            max="2024"
          />
        </FormControl>
        
        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isLoading}
          loadingText="Buscando..."
          width="full"
        >
          Buscar Carros
        </Button>
      </VStack>
    </Box>
  );
}