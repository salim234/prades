import React, { useEffect, useState } from 'react';
import { locationService } from '../services/locationService';
import { Province, Regency, District, Village } from '../types';
import { MapPin } from 'lucide-react';

interface AddressSelectorsProps {
  onAddressChange: (
    province: Province | null,
    regency: Regency | null,
    district: District | null,
    village: Village | null
  ) => void;
}

export const AddressSelectors: React.FC<AddressSelectorsProps> = ({ onAddressChange }) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedRegency, setSelectedRegency] = useState<Regency | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);

  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoading('provinces');
    locationService.getProvinces().then(data => {
      setProvinces(data);
      setLoading(null);
    });
  }, []);

  // Update parent whenever selection changes
  useEffect(() => {
    onAddressChange(selectedProvince, selectedRegency, selectedDistrict, selectedVillage);
  }, [selectedProvince, selectedRegency, selectedDistrict, selectedVillage, onAddressChange]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const province = provinces.find(p => p.id === id) || null;
    setSelectedProvince(province);
    setSelectedRegency(null);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    setRegencies([]);
    setDistricts([]);
    setVillages([]);

    if (province) {
      setLoading('regencies');
      locationService.getRegencies(province.id).then(data => {
        setRegencies(data);
        setLoading(null);
      });
    }
  };

  const handleRegencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const regency = regencies.find(r => r.id === id) || null;
    setSelectedRegency(regency);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    setDistricts([]);
    setVillages([]);

    if (regency) {
      setLoading('districts');
      locationService.getDistricts(regency.id).then(data => {
        setDistricts(data);
        setLoading(null);
      });
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const district = districts.find(d => d.id === id) || null;
    setSelectedDistrict(district);
    setSelectedVillage(null);
    setVillages([]);

    if (district) {
      setLoading('villages');
      locationService.getVillages(district.id).then(data => {
        setVillages(data);
        setLoading(null);
      });
    }
  };

  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const village = villages.find(v => v.id === id) || null;
    setSelectedVillage(village);
  };

  const selectClass = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indo-red focus:border-indo-red sm:text-sm rounded-md shadow-sm border bg-white disabled:bg-gray-100 disabled:text-gray-400";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2 text-gray-700 font-semibold border-b pb-2">
         <MapPin className="w-5 h-5 text-indo-red" />
         <h3>Alamat Lengkap Sesuai KTP</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Provinsi</label>
          <select
            value={selectedProvince?.id || ''}
            onChange={handleProvinceChange}
            className={selectClass}
          >
            <option value="">-- Pilih Provinsi --</option>
            {provinces.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Kabupaten/Kota</label>
          <select
            value={selectedRegency?.id || ''}
            onChange={handleRegencyChange}
            disabled={!selectedProvince}
            className={selectClass}
          >
            <option value="">{loading === 'regencies' ? 'Memuat...' : '-- Pilih Kabupaten/Kota --'}</option>
            {regencies.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Kecamatan</label>
          <select
            value={selectedDistrict?.id || ''}
            onChange={handleDistrictChange}
            disabled={!selectedRegency}
            className={selectClass}
          >
            <option value="">{loading === 'districts' ? 'Memuat...' : '-- Pilih Kecamatan --'}</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Desa/Kelurahan</label>
          <select
            value={selectedVillage?.id || ''}
            onChange={handleVillageChange}
            disabled={!selectedDistrict}
            className={selectClass}
          >
            <option value="">{loading === 'villages' ? 'Memuat...' : '-- Pilih Desa --'}</option>
            {villages.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};