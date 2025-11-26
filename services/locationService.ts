import { Province, Regency, District, Village } from '../types';

// Menggunakan API dari ibnux (GitHub Pages) yang lebih stabil dan mendukung CORS
const BASE_URL = 'https://ibnux.github.io/data-indonesia';

export const locationService = {
  getProvinces: async (): Promise<Province[]> => {
    try {
      const response = await fetch(`${BASE_URL}/propinsi.json`);
      if (!response.ok) throw new Error('Failed to fetch provinces');
      const data = await response.json();
      // Map 'nama' to 'name'
      return data.map((item: any) => ({
        id: item.id,
        name: item.nama
      }));
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }
  },

  getRegencies: async (provinceId: string): Promise<Regency[]> => {
    try {
      const response = await fetch(`${BASE_URL}/kabupaten/${provinceId}.json`);
      if (!response.ok) throw new Error('Failed to fetch regencies');
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        province_id: item.id_propinsi,
        name: item.nama
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  getDistricts: async (regencyId: string): Promise<District[]> => {
    try {
      const response = await fetch(`${BASE_URL}/kecamatan/${regencyId}.json`);
      if (!response.ok) throw new Error('Failed to fetch districts');
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        regency_id: item.id_kabupaten,
        name: item.nama
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  getVillages: async (districtId: string): Promise<Village[]> => {
    try {
      const response = await fetch(`${BASE_URL}/kelurahan/${districtId}.json`);
      if (!response.ok) throw new Error('Failed to fetch villages');
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        district_id: item.id_kecamatan,
        name: item.nama
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  }
};
