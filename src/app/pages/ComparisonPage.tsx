'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Plus } from 'lucide-react';
import CarSelector from '../components/CarSelector';
import ComparisonCards from '../components/ComparisonCards';
import InsightsPanel from '../components/InsightsPanel';
import { useToast } from '../components/UseToast';
import { Button } from '../components/Button';

export default function ComparisonPage() {
  const { toast } = useToast();
  const [slots, setSlots] = useState([
    { id: 1, data: null, loading: false },
    { id: 2, data: null, loading: false }
  ]);
  const [nextId, setNextId] = useState(3);

  const handleUpdateSlot = (id, field, value) => {
    setSlots(current => current.map(slot => slot.id === id ? { ...slot, [field]: value } : slot));
  };

  const addSlot = () => {
    if (slots.length >= 4) {
      toast({
        title: 'Limite atingido',
        description: 'Você pode comparar no máximo 4 veículos.',
        variant: 'destructive'
      });
      return;
    }
    setSlots([...slots, { id: nextId, data: null, loading: false }]);
    setNextId(nextId + 1);
  };

  const removeSlot = (id) => {
    if (slots.length <= 1) return;
    setSlots(slots.filter(slot => slot.id !== id));
  };

  const activeCarsCount = slots.filter(s => s.data).length;
  const isLoadingAny = slots.some(s => s.loading);

  return (
    <div className="min-h-screen">
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
              <h1 className="text-xl font-bold text-slate-900">Comparador FIPE</h1>
              <p className="text-xs text-slate-600 hidden sm:block">Compare até 4 veículos simultaneamente</p>
            </div>
          </div>

          <Button onClick={addSlot} disabled={slots.length >= 4} variant="outline" size="sm" className="gap-2 hidden sm:flex">
            <Plus className="w-4 h-4" /> Adicionar Veículo
          </Button>
          <Button onClick={addSlot} disabled={slots.length >= 4} variant="outline" size="icon" className="sm:hidden">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        <div className={`grid gap-6 mb-8 transition-all duration-300 ${
          slots.length === 1 ? 'grid-cols-1 max-w-xl mx-auto' :
          slots.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
          slots.length === 3 ? 'grid-cols-1 lg:grid-cols-3' :
          'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
        }`}>
          <AnimatePresence mode="popLayout">
            {slots.map((slot, index) => (
              <motion.div key={slot.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
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

        {activeCarsCount > 0 && (
          <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Comparativo</h2>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
            <ComparisonCards slots={slots} />
            {activeCarsCount >= 2 && <InsightsPanel slots={slots} />}
          </motion.div>
        )}

        {activeCarsCount === 0 && !isLoadingAny && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              <Car className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Comece sua comparação</h2>
            <p className="text-slate-600 max-w-md mx-auto">
              Selecione marca, modelo e ano nos cartões acima para comparar preços e especificações técnicas.
            </p>
          </motion.div>
        )}
      </div>

      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-600">
          Dados fornecidos pela Tabela FIPE - Fundação Instituto de Pesquisas Econômicas
        </div>
      </footer>
    </div>
  );
}
