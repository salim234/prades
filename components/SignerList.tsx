import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { User, MapPin, Clock, History } from 'lucide-react';

interface Signer {
  id: string;
  full_name: string;
  position: string;
  province_name: string | null;
  regency_name: string | null;
  district_name: string | null;
  village_name: string | null;
  address: string | null;
  created_at: string;
}

export const SignerList: React.FC = () => {
  const [signers, setSigners] = useState<Signer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSigners();

    // Realtime subscription untuk update otomatis saat ada yang tanda tangan
    const channel = supabase
      .channel('public:signatures_list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signatures' },
        (payload) => {
          const newSigner = payload.new as Signer;
          setSigners((prev) => [newSigner, ...prev].slice(0, 100)); // Keep latest 100
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSigners = async () => {
    try {
      // Mengambil 50 data terbaru
      const { data, error } = await supabase
        .from('signatures')
        .select('id, full_name, position, province_name, regency_name, district_name, village_name, address, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSigners(data || []);
    } catch (error) {
      console.error('Error fetching signers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLocation = (s: Signer) => {
    // Prioritaskan data wilayah terstruktur
    if (s.village_name && s.regency_name) {
      return `${s.village_name}, ${s.regency_name}`;
    }
    // Fallback ke alamat manual (untuk data import PDF)
    if (s.address) {
        // Potong alamat jika terlalu panjang agar tampilan rapi
        return s.address.length > 35 ? s.address.substring(0, 35) + '...' : s.address;
    }
    return s.province_name || 'Indonesia';
  };

  const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'Baru saja';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <History className="w-5 h-5 text-indo-red" />
          Dukungan Terbaru
        </h3>
        <span className="text-xs font-medium bg-white border px-2 py-1 rounded-full text-slate-500">
            Realtime
        </span>
      </div>
      
      <div className="overflow-y-auto flex-1 p-0 scroll-smooth">
        {loading ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indo-red mb-2"></div>
              Memuat data...
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {signers.map((signer) => (
              <li key={signer.id} className="p-4 hover:bg-slate-50 transition-colors animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center flex-shrink-0 text-indo-red font-bold text-sm border border-red-100">
                    {signer.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-slate-900 truncate pr-2">{signer.full_name}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(signer.created_at)}
                        </span>
                    </div>
                    <p className="text-xs font-medium text-indo-red truncate mb-1">{signer.position}</p>
                    <div className="flex items-center text-xs text-slate-500">
                         <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                         <span className="truncate max-w-[200px]">
                           {formatLocation(signer)}
                         </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {signers.length === 0 && (
                <li className="p-8 text-center text-slate-500 text-sm">
                    Belum ada data dukungan yang ditampilkan.
                </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};
