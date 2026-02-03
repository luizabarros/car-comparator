'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Plus } from 'lucide-react';
import { useToast } from '../components/UseToast';
import { Button } from '../components/Button';
import CarSelector from '../components/CarSelector';
import ComparisonAIResult from '../components/ComparisonAIResult';
import PriceHistoryChart from '../components/PriceHistoryChart';

export default function ComparisonPage() {
  const { toast } = useToast();

  const [slots, setSlots] = useState([
    { id: 1, data: null, loading: false },
    { id: 2, data: null, loading: false },
  ]);

  const [nextId, setNextId] = useState(3);
  const [comparisonHTML, setComparisonHTML] = useState<string | null>(null);
  const [priceHistoryCars, setPriceHistoryCars] = useState<any[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const handleUpdateSlot = (id: number, field: string, value: any) => {
    setSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot)));
  };

  const handleCompare = async () => {
    setComparisonHTML(null);
    setPriceHistoryCars([]);

    const filledSlots = slots.filter((s) => s.data);

    if (filledSlots.length < 2) {
      toast({
        title: 'Selecione ao menos 2 veículos',
        variant: 'destructive',
      });
      return;
    }

    setIsComparing(true);

    try {
      const selectedCars = filledSlots.map((s) => `${s.data.Modelo}, ${s.data.AnoModelo}`);

      console.log('🚗 Enviando para API:', selectedCars);

      const response = await fetch('/api/search-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedCars),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Erro ao comparar veículos');
      }

      const data = await response.json();

      if (!data.success || !data.comparisonHTML) {
        throw new Error('Resposta da API inválida');
      }

      setComparisonHTML(data.comparisonHTML);

      const carsWithHistory = filledSlots
        .map((slot) => ({
          model: `${slot.data.Modelo} ${slot.data.AnoModelo}`,
          priceHistory: slot.data.PriceHistory || [],
        }))
        .filter((car) => car.priceHistory.length > 0);

      setPriceHistoryCars(carsWithHistory);

      toast({
        title: 'Comparação realizada!',
        description: `${filledSlots.length} veículos comparados com sucesso.`,
        variant: 'default',
      });
    } catch (err) {
      console.error('❌ Erro na comparação:', err);

      toast({
        title: 'Erro na comparação',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsComparing(false);
    }
  };

  const addSlot = () => {
    if (slots.length >= 4) {
      toast({
        title: 'Limite atingido',
        description: 'Você pode comparar no máximo 4 veículos.',
        variant: 'destructive',
      });
      return;
    }

    setSlots((prev) => [...prev, { id: nextId, data: null, loading: false }]);

    setNextId((id) => id + 1);
  };

  const removeSlot = (id: number) => {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  const activeCarsCount = slots.filter((s) => s.data).length;
  const isLoadingAny = slots.some((s) => s.loading) || isComparing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg shadow-md">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">MeuCarroIdeal</h1>
              <p className="text-xs text-slate-600 hidden sm:block">
                Compare até 4 veículos
              </p>
            </div>
          </div>

          <Button
            onClick={addSlot}
            disabled={slots.length >= 4 || isLoadingAny}
            variant="outline"
            size="sm"
            className="gap-2 hidden sm:flex"
          >
            <Plus className="w-4 h-4" /> Adicionar Veículo
          </Button>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        <div
          className={`grid gap-6 mb-8 ${
            slots.length === 1
              ? 'grid-cols-1 max-w-xl mx-auto'
              : slots.length === 2
                ? 'grid-cols-1 lg:grid-cols-2'
                : slots.length === 3
                  ? 'grid-cols-1 lg:grid-cols-3'
                  : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
          }`}
        >
          <AnimatePresence mode="popLayout">
            {slots.map((slot, index) => (
              <motion.div
                key={slot.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <CarSelector
                  id={slot.id}
                  carNumber={index + 1}
                  onCarDataChange={(data) => handleUpdateSlot(slot.id, 'data', data)}
                  onLoadingChange={(loading) => handleUpdateSlot(slot.id, 'loading', loading)}
                  onRemove={slots.length > 1 ? () => removeSlot(slot.id) : null}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex justify-center mb-8">
          <Button
            onClick={handleCompare}
            disabled={activeCarsCount < 2 || isLoadingAny}
            size="lg"
            className="gap-2 px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {isComparing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analisando...
              </>
            ) : (
              <>
                <Car className="w-5 h-5" />
                Comparar {activeCarsCount} veículos
              </>
            )}
          </Button>
        </div>

        {isComparing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="font-semibold text-blue-900">Processando análise...</h3>
                <p className="text-sm text-blue-700">
                  Buscando informações, extraindo dados e gerando comparativo.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {comparisonHTML && !isComparing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ComparisonAIResult html={comparisonHTML} />
          </motion.div>
        )}

        {priceHistoryCars.length > 0 && !isComparing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <PriceHistoryChart cars={priceHistoryCars} />
          </motion.div>
        )}

        {activeCarsCount === 0 && !isLoadingAny && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              <Car className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Comece sua comparação inteligente
            </h2>
            <p className="text-slate-600 max-w-md mx-auto mb-4">
              Selecione marca, modelo e ano nos cartões acima. Vamos buscar informações e gerar um relatório completo.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}