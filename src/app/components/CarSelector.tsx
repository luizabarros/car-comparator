'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, ChevronDown, Loader2, X } from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { fipeService } from '../services/fipe.service';
import { useToast } from './UseToast';
import { Button } from './Button';

export default function CarSelector({ id, carNumber, onCarDataChange, onLoadingChange, onRemove }) {
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { toast } = useToast();

  // Load brands
  useEffect(() => {
    loadBrands();
  }, []);

  // Sync loading state
  useEffect(() => {
    onLoadingChange(loadingDetails);
  }, [loadingDetails, onLoadingChange]);

  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const data = await fipeService.getBrands();
      setBrands(data);
    } catch {
      toast({
        title: 'Erro ao carregar marcas',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadModels = async (brandCode) => {
    setLoadingModels(true);
    setModels([]);
    setYears([]);
    setSelectedModel('');
    setSelectedYear('');
    onCarDataChange(null);

    try {
      const data = await fipeService.getModels(brandCode);
      setModels(data.modelos || []);
    } catch {
      toast({
        title: 'Erro ao carregar modelos',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingModels(false);
    }
  };

  const loadYears = async (brandCode, modelCode) => {
    setLoadingYears(true);
    setYears([]);
    setSelectedYear('');
    onCarDataChange(null);

    try {
      const data = await fipeService.getYears(brandCode, modelCode);
      setYears(data);
    } catch {
      toast({
        title: 'Erro ao carregar anos',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingYears(false);
    }
  };

  const loadCarDetails = async (brandCode, modelCode, yearCode) => {
    setLoadingDetails(true);

    try {
      const data = await fipeService.getCarDetails(brandCode, modelCode, yearCode);
      onCarDataChange(data);
    } catch {
      toast({
        title: 'Erro ao carregar detalhes',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
      onCarDataChange(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBrandChange = (e) => {
    const value = e.target.value;
    setSelectedBrand(value);
    if (value) {
      loadModels(value);
    } else {
      setModels([]);
      setYears([]);
      setSelectedModel('');
      setSelectedYear('');
      onCarDataChange(null);
    }
  };

  const handleModelChange = (e) => {
    const value = e.target.value;
    setSelectedModel(value);
    if (value && selectedBrand) {
      loadYears(selectedBrand, value);
    } else {
      setYears([]);
      setSelectedYear('');
      onCarDataChange(null);
    }
  };

  const handleYearChange = (e) => {
    const value = e.target.value;
    setSelectedYear(value);
    if (value && selectedBrand && selectedModel) {
      loadCarDetails(selectedBrand, selectedModel, value);
    } else {
      onCarDataChange(null);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 h-full flex flex-col relative"
    >
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2.5 rounded-lg">
            <Car className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Veículo {carNumber}</h2>
            <p className="text-xs text-slate-600">Selecione as opções</p>
          </div>
        </div>

        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 -mr-2"
            title="Remover veículo"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="space-y-5 flex-1">
        {/* Brand Selector */}
        <div className="space-y-2">
          <Label htmlFor={`brand-${carNumber}`}>Marca</Label>
          <div className="relative">
            <select
              id={`brand-${carNumber}`}
              value={selectedBrand}
              onChange={handleBrandChange}
              disabled={loadingBrands}
              className="w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="">Selecione a marca</option>
              {brands.map((brand) => (
                <option key={brand.codigo} value={brand.codigo}>
                  {brand.nome}
                </option>
              ))}
            </select>

            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {loadingBrands ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
        </div>

        {/* Model Selector */}
        <div className="space-y-2">
          <Label htmlFor={`model-${carNumber}`}>Modelo</Label>
          <div className="relative">
            <select
              id={`model-${carNumber}`}
              value={selectedModel}
              onChange={handleModelChange}
              disabled={!selectedBrand || loadingModels || models.length === 0}
              className="w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="">Selecione o modelo</option>
              {models.map((model) => (
                <option key={model.codigo} value={model.codigo}>
                  {model.nome}
                </option>
              ))}
            </select>

            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {loadingModels ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
        </div>

        {/* Year Selector */}
        <div className="space-y-2">
          <Label htmlFor={`year-${carNumber}`}>Ano</Label>
          <div className="relative">
            <select
              id={`year-${carNumber}`}
              value={selectedYear}
              onChange={handleYearChange}
              disabled={!selectedModel || loadingYears || years.length === 0}
              className="w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="">Selecione o ano</option>
              {years.map((year) => (
                <option key={year.codigo} value={year.codigo}>
                  {year.nome}
                </option>
              ))}
            </select>

            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {loadingYears ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {loadingDetails && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Carregando detalhes...</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
