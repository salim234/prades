import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, TrendingUp } from 'lucide-react';

export const PetitionStats: React.FC = () => {
  const [totalSignatures, setTotalSignatures] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const target = 1000000;

  useEffect(() => {
    // 1. Initial Fetch
    fetchCount();

    // 2. Setup Realtime Subscription
    // Mendengarkan event INSERT pada tabel signatures
    const channel = supabase
      .channel('public:signatures')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signatures' },
        (payload) => {
          // Update counter secara optimistik
          setTotalSignatures((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCount = async () => {
    setLoading(true);
    try {
      // Coba gunakan RPC (Function Database) terlebih dahulu
      const { data, error } = await supabase.rpc('get_petition_count');
      if (error) throw error;
      setTotalSignatures(data || 0);
    } catch (err: any) {
      console.warn("RPC get_petition_count failed, using fallback method:", err.message);
      
      // Fallback: Gunakan standar count dari table
      const { count, error } = await supabase
        .from('signatures')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setTotalSignatures(count);
      }
    } finally {
      setLoading(false);
    }
  };

  const percentage = Math.min((totalSignatures / target) * 100, 100);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Progres Pernyataan Sikap</h3>
        <div className="flex items-center text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full animate-pulse">
           <TrendingUp className="w-3 h-3 mr-1" />
           Live Realtime
        </div>
      </div>
      
      <div>
        <div className="flex justify-between text-sm font-medium mb-1">
          {loading ? (
             <span className="text-indo-red flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Sinkronisasi...</span>
          ) : (
             <span className="text-indo-red font-bold text-lg">{totalSignatures.toLocaleString('id-ID')} Penandatangan</span>
          )}
          <span className="text-gray-500">Target: {target.toLocaleString('id-ID')}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-indo-red h-4 rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex justify-between">
          <span><b>{percentage.toFixed(4)}%</b> tercapai</span>
          <span>Ayo bagikan!</span>
        </p>
      </div>
    </div>
  );
};