import { Province, Regency, District, Village } from '../types';

const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

// Fallback data in case the API is down or rate limited
const FALLBACK_PROVINCES: Province[] = [
  { id: '31', name: 'DKI JAKARTA' },
  { id: '32', name: 'JAWA BARAT' },
  { id: '33', name: 'JAWA TENGAH' },
  { id: '34', name: 'DI YOGYAKARTA' },
  { id: '35', name: 'JAWA TIMUR' },
];

export const locationService = {
  getProvinces: async (): Promise<Province[]> => {
    try {
      const response = await fetch(`${BASE_URL}/provinces.json`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.warn('Using fallback provinces due to API error:', error);
      return FALLBACK_PROVINCES;
    }
  },

  getRegencies: async (provinceId: string): Promise<Regency[]> => {
    try {
      const response = await fetch(`${BASE_URL}/regencies/${provinceId}.json`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  getDistricts: async (regencyId: string): Promise<District[]> => {
    try {
      const response = await fetch(`${BASE_URL}/districts/${regencyId}.json`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  getVillages: async (districtId: string): Promise<Village[]> => {
    try {
      const response = await fetch(`${BASE_URL}/villages/${districtId}.json`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  }
};