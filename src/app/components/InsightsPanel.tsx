"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  AlertCircle,
  BarChart3,
} from "lucide-react";

function InsightsPanel({ slots }) {
  const cars = slots.map((s) => s.data).filter(Boolean);

  if (cars.length < 2) return null;

  const parsePrice = (priceString) => {
    if (!priceString) return 0;
    return parseFloat(
      priceString
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim()
    );
  };

  const carsWithPrices = cars
    .map((car) => ({
      ...car,
      numericPrice: parsePrice(car.Valor),
    }))
    .sort((a, b) => a.numericPrice - b.numericPrice);

  const cheapest = carsWithPrices[0];
  const mostExpensive = carsWithPrices[carsWithPrices.length - 1];

  const priceDifference = mostExpensive.numericPrice - cheapest.numericPrice;
  const percentageDifference = (
    (priceDifference / cheapest.numericPrice) *
    100
  ).toFixed(1);

  const insights = [
    {
      icon: TrendingUp,
      title: "Maior Valor",
      description: `${mostExpensive.Marca} ${mostExpensive.Modelo}`,
      value: mostExpensive.Valor,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      icon: TrendingDown,
      title: "Menor Valor",
      description: `${cheapest.Marca} ${cheapest.Modelo}`,
      value: cheapest.Valor,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      icon: DollarSign,
      title: "Variação de Preço",
      description: `Entre o maior e menor`,
      value: `+${percentageDifference}%`,
      subValue: `R$ ${priceDifference.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
  ];

  const additionalInsights = [];

  const allSameFuel = cars.every((c) => c.Combustivel === cars[0].Combustivel);
  if (allSameFuel) {
    additionalInsights.push({
      icon: Award,
      text: `Todos os veículos utilizam ${cars[0].Combustivel}`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    });
  } else {
    const fuels = [...new Set(cars.map((c) => c.Combustivel))];
    additionalInsights.push({
      icon: AlertCircle,
      text: `Combustíveis variados: ${fuels.join(", ")}`,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    });
  }

  const allSameYear = cars.every((c) => c.AnoModelo === cars[0].AnoModelo);
  if (allSameYear) {
    additionalInsights.push({
      icon: Award,
      text: `Todos são do ano ${cars[0].AnoModelo}`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-8"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2.5 rounded-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Análise Comparativa
            </h2>
            <p className="text-sm text-slate-600">
              Insights baseados nos {cars.length} veículos selecionados
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`${insight.bgColor} ${insight.borderColor} border-2 rounded-xl p-4 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-3">
                <div className={`${insight.bgColor} p-2 rounded-lg`}>
                  <insight.icon className={`w-5 h-5 ${insight.color}`} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1 truncate">
                    {insight.title}
                  </p>
                  <p className={`text-xl font-bold ${insight.color} mb-0.5`}>
                    {insight.value}
                  </p>
                  {insight.subValue && (
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      {insight.subValue}
                    </p>
                  )}
                  <p className="text-sm text-slate-600 truncate">
                    {insight.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {additionalInsights.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {additionalInsights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className={`${insight.bgColor} rounded-lg p-3 flex items-center gap-3`}
              >
                <insight.icon
                  className={`w-5 h-5 ${insight.color} flex-shrink-0`}
                />
                <p className={`text-sm font-medium ${insight.color}`}>
                  {insight.text}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default InsightsPanel;
