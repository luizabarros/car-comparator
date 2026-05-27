const FIPE_API_BASE_V2 = 'https://fipe.parallelum.com.br/api/v2';

export const fipeService = {
  getBrands: async (): Promise<any[]> => {
    const res = await fetch(`${FIPE_API_BASE_V2}/cars/brands`);
    if (!res.ok) throw new Error('Failed to fetch brands');
    const data = await res.json();
    
    return data.map((brand: any) => ({
      codigo: brand.code,
      nome: brand.name,
    }));
  },

  getModels: async (brandCode: string | number): Promise<any> => {
    const res = await fetch(`${FIPE_API_BASE_V2}/cars/brands/${brandCode}/models`);
    if (!res.ok) throw new Error('Failed to fetch models');
    const data = await res.json();

    return {
      modelos: data.map((model: any) => ({
        codigo: model.code,
        nome: model.name,
      })),
    };
  },

  getYears: async (
    brandCode: string | number,
    modelCode: string | number,
  ): Promise<any> => {
    const res = await fetch(`${FIPE_API_BASE_V2}/cars/brands/${brandCode}/models/${modelCode}/years`);
    if (!res.ok) throw new Error('Failed to fetch years');
    const data = await res.json();

    return data.map((year: any) => ({
      codigo: year.code,
      nome: year.name,
    }));
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
