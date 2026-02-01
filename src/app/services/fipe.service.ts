const FIPE_API_BASE = 'https://parallelum.com.br/fipe/api/v1/carros';
const FIPE_API_BASE_2 = 'https://fipe.parallelum.com.br/api/v2/cars';

export const fipeService = {
  getBrands: async (): Promise<any[]> => {
    const res = await fetch(`${FIPE_API_BASE}/marcas`);
    if (!res.ok) throw new Error('Failed to fetch brands');
    return res.json();
  },

  getModels: async (brandCode: string | number): Promise<any> => {
    const res = await fetch(`${FIPE_API_BASE}/marcas/${brandCode}/modelos`);
    if (!res.ok) throw new Error('Failed to fetch models');
    return res.json();
  },

  getYears: async (brandCode: string | number, modelCode: string | number): Promise<any> => {
    const res = await fetch(`${FIPE_API_BASE}/marcas/${brandCode}/modelos/${modelCode}/anos`);
    if (!res.ok) throw new Error('Failed to fetch years');
    return res.json();
  },

  getCarDetails: async (
    brandCode: string | number,
    modelCode: string | number,
    yearCode: string | number,
  ): Promise<any> => {
    const res = await fetch(
      `${FIPE_API_BASE}/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`,
    );
    if (!res.ok) throw new Error('Failed to fetch car details');
    return res.json();
  },

  getCarHistory: async (
    brandCode: string | number,
    modelCode: string | number,
    yearCode: string | number,
  ): Promise<any> => {
    const res = await fetch(
      `${FIPE_API_BASE_2}/brands/${brandCode}/models/${modelCode}/years/${yearCode}`,
    );
    if (!res.ok) throw new Error('Failed to fetch car details');
    return res.json();
  },
};
