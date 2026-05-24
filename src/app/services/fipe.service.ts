import { normalizeVehicleText } from '@/lib/tcc-config';

const FIPE_API_BASE_V2 = 'https://fipe.parallelum.com.br/api/v2';

const BYD_BRAND = 'byd';
const ALLOWED_MODEL_ORDER = ['Byd Dolphin Mini', 'Byd Dolphin Plus'];
const ALLOWED_YEARS = [2025, 2024];

function matchesAllowedModel(name: string, allowedModel: string) {
  const normalizedName = normalizeVehicleText(name);
  const normalizedAllowedModel = normalizeVehicleText(allowedModel).replace(/^byd\s+/, '');

  return normalizedAllowedModel
    .split(' ')
    .every((token) => normalizedName.includes(token));
}

export const fipeService = {
  getBrands: async (): Promise<any[]> => {
    const res = await fetch(`${FIPE_API_BASE_V2}/cars/brands`);
    if (!res.ok) throw new Error('Failed to fetch brands');
    const data = await res.json();
    
    return data
      .filter((brand: any) => normalizeVehicleText(brand.name) === BYD_BRAND)
      .map((brand: any) => ({
        codigo: brand.code,
        nome: brand.name,
      }));
  },

  getModels: async (brandCode: string | number, allowedModel?: string): Promise<any> => {
    const res = await fetch(`${FIPE_API_BASE_V2}/cars/brands/${brandCode}/models`);
    if (!res.ok) throw new Error('Failed to fetch models');
    const data = await res.json();

    const modelAllowlist = allowedModel ? [allowedModel] : ALLOWED_MODEL_ORDER;

    return {
      modelos: modelAllowlist.flatMap((allowed) =>
        data
          .filter((model: any) => matchesAllowedModel(model.name, allowed))
          .map((model: any) => ({
            codigo: model.code,
            nome: model.name,
          })),
      ),
    };
  },

  getYears: async (
    brandCode: string | number,
    modelCode: string | number,
    allowedYear?: number,
  ): Promise<any> => {
    const res = await fetch(`${FIPE_API_BASE_V2}/cars/brands/${brandCode}/models/${modelCode}/years`);
    if (!res.ok) throw new Error('Failed to fetch years');
    const data = await res.json();

    const yearAllowlist = allowedYear ? [allowedYear] : ALLOWED_YEARS;

    return yearAllowlist.flatMap((allowed) =>
      data
        .filter((year: any) => normalizeVehicleText(year.name).startsWith(String(allowed)))
        .map((year: any) => ({
          codigo: year.code,
          nome: year.name,
        })),
    );
  },

  getCarDetails: async (
    brandCode: string | number,
    modelCode: string | number,
    yearCode: string | number,
  ): Promise<any> => {

    const res = await fetch(
      `${FIPE_API_BASE_V2}/cars/brands/${brandCode}/models/${modelCode}/years/${yearCode}`
    );

    if (!res.ok) throw new Error('Failed to fetch car details');
    const data = await res.json();

    const history = await fetch(
      `${FIPE_API_BASE_V2}/cars/${data.codeFipe}/years/${yearCode}/history`)

    if (!history.ok) throw new Error('Failed to fetch price history');
    const historyData = await history.json();
    
    return {
      Modelo: data.model,
      AnoModelo: data.modelYear,
      Valor: data.price,
      Marca: data.brand,
      Combustivel: data.fuel,
      CodigoFipe: data.codeFipe,
      MesReferencia: data.referenceMonth,
      TipoVeiculo: data.vehicleType,
      SiglaCombustivel: data.fuelAcronym,
      PriceHistory: historyData.priceHistory || [],
      MarcaCodigo: brandCode,
      ModeloCodigo: modelCode,
      AnoCodigo: yearCode,
    };
  },
};
