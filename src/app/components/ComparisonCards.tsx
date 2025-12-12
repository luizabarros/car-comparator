'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Fuel, DollarSign, Tag, Gauge, Loader2 } from 'lucide-react';

interface Slot {
  id: number;
  data: any;
  loading: boolean;
}

interface ComparisonCardsProps {
  slots: Slot[];
}

export default function ComparisonCards({ slots }: ComparisonCardsProps) {
  const getGridClass = (count: number) => {
    switch(count) {
      case 1: return "grid-cols-1 max-w-xl mx-auto";
      case 2: return "grid-cols-1 lg:grid-cols-2";
      case 3: return "grid-cols-1 lg:grid-cols-3";
      default: return "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";
    }
  };

  const renderCarCard = (slot: Slot) => {
    const { data: car, loading } = slot;

    if (loading) {
      return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Atualizando dados...</p>
          </div>
        </div>
      );
    }

    if (!car) {
      return (
        <div className="bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-300 p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="bg-slate-100 p-4 rounded-full mb-4">
            <Tag className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-900 font-semibold mb-1">Aguardando seleção</p>
          <p className="text-slate-500 text-sm">Selecione um veículo no painel acima para ver os detalhes</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6">
          <h3 className="text-2xl font-bold text-white mb-1 leading-tight">{car.Marca} {car.Modelo}</h3>
          <p className="text-blue-100 text-sm">{car.AnoModelo}</p>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-600">Preço FIPE</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{car.Valor}</p>
        </div>

        <div className="p-6 space-y-4 flex-1">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Ano Modelo</p>
              <p className="text-base font-bold text-slate-900">{car.AnoModelo}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <Fuel className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Combustível</p>
              <p className="text-base font-bold text-slate-900">{car.Combustivel}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <Tag className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Código FIPE</p>
              <p className="text-base font-bold text-slate-900">{car.CodigoFipe}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <Gauge className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Referência</p>
              <p className="text-base font-bold text-slate-900">{car.MesReferencia}</p>
            </div>
          </div>

          {car.SiglaCombustivel && (
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <Fuel className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Tipo</p>
                <p className="text-base font-bold text-slate-900">{car.SiglaCombustivel}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`grid gap-6 ${getGridClass(slots.length)}`}>
      <AnimatePresence mode="popLayout">
        {slots.map((slot) => (
          <motion.div
            key={slot.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {renderCarCard(slot)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
