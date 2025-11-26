export interface Province {
  id: string;
  name: string;
}

export interface Regency {
  id: string;
  province_id: string;
  name: string;
}

export interface District {
  id: string;
  regency_id: string;
  name: string;
}

export interface Village {
  id: string;
  district_id: string;
  name: string;
}

export interface SignerData {
  fullName: string;
  province: Province | null;
  regency: Regency | null;
  district: District | null;
  village: Village | null;
  position: string;
  reason: string;
  signature: string; // Base64 data URL
}

export enum FormStep {
  DETAILS = 0,
  ADDRESS = 1,
  SIGNATURE = 2,
  SUCCESS = 3
}

export const VILLAGE_POSITIONS = [
  "Kepala Desa",
  "Sekretaris Desa",
  "Kaur Keuangan",
  "Kaur Perencanaan",
  "Kaur Tata Usaha & Umum",
  "Kasi Pemerintahan",
  "Kasi Kesejahteraan",
  "Kasi Pelayanan",
  "Kepala Dusun",
  "Staf Perangkat Desa",
  "BPD",
  "Lainnya"
];