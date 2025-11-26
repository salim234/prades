import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from './services/supabaseClient';
import { AddressSelectors } from './components/AddressSelectors';
import { SignaturePad } from './components/SignaturePad';
import { PetitionStats } from './components/PetitionStats';
import { SignerList } from './components/SignerList';
import { ExportManager } from './components/ExportManager';
import { FormStep, SignerData, VILLAGE_POSITIONS } from './types';
import { FileText, CheckCircle, ChevronRight, ShieldCheck, Flag, User, MapPin, Signature, Download, Loader2, UploadCloud } from 'lucide-react';

const FIXED_REASON = "Menuntut kepastian status kepegawaian sebagai ASN Desa dalam UU ASN 2026.";
const DRIVE_URL = "https://drive.google.com/drive/folders/1k8nrUuH_DUTHxIYgtmMTlugAtsmikSrN?usp=sharing";

export default function App() {
  const [step, setStep] = useState<FormStep>(FormStep.DETAILS);
  const [formData, setFormData] = useState<SignerData>({
    fullName: '',
    province: null,
    regency: null,
    district: null,
    village: null,
    position: '',
    reason: '',
    signature: ''
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);

  const handleNext = () => {
    if (step === FormStep.DETAILS) {
      if (!formData.fullName || !formData.position) {
        alert("Mohon lengkapi nama dan jabatan.");
        return;
      }
      setStep(FormStep.ADDRESS);
    } else if (step === FormStep.ADDRESS) {
      if (!formData.village) {
        alert("Mohon lengkapi alamat hingga tingkat Desa/Kelurahan.");
        return;
      }
      // Set fixed reason when moving to signature step
      setFormData(prev => ({ ...prev, reason: FIXED_REASON }));
      setStep(FormStep.SIGNATURE);
    }
  };

  const handleSign = (dataUrl: string) => {
    setFormData(prev => ({ ...prev, signature: dataUrl }));
  };

  const handleSubmit = async () => {
    if (!formData.reason) {
      setFormData(prev => ({ ...prev, reason: FIXED_REASON }));
    }
    if (!formData.signature) {
      alert("Mohon tanda tangan terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Prepare payload for Supabase
      const payload = {
        full_name: formData.fullName,
        position: formData.position,
        province_id: formData.province?.id,
        province_name: formData.province?.name,
        regency_id: formData.regency?.id,
        regency_name: formData.regency?.name,
        district_id: formData.district?.id,
        district_name: formData.district?.name,
        village_id: formData.village?.id,
        village_name: formData.village?.name,
        reason: FIXED_REASON,
        signature: formData.signature // storing base64 directly
      };

      // 2. Insert into Supabase
      const { error } = await supabase
        .from('signatures')
        .insert([payload]);

      if (error) {
        throw error;
      }

      // 3. Success
      setStep(FormStep.SUCCESS);
      
    } catch (error: any) {
      console.error('Error submitting petition:', error);
      alert(`Maaf, gagal menyimpan data: ${error.message || 'Terjadi kesalahan jaringan'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!letterRef.current) return;
    
    setIsDownloading(true);
    try {
      // 1. Capture content using html2canvas
      const canvas = await html2canvas(letterRef.current, {
        scale: 1.5, // Lower scale to reduce file size
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
           const element = clonedDoc.querySelector('[data-pdf-content="true"]') as HTMLElement;
           if (element) {
             element.style.boxShadow = 'none';
             element.style.transform = 'none';
             element.style.margin = '0';
           }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.75);

      // 2. Initialize PDF (A4 Portrait)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
      pdf.save(`Pernyataan_Sikap_${formData.fullName.replace(/\s+/g, '_')}.pdf`);
      
    } catch (error) {
      console.error("Download failed", error);
      alert("Gagal mengunduh gambar. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderProgressBar = () => {
    const steps = [
      { num: 1, label: 'Biodata' },
      { num: 2, label: 'Alamat' },
      { num: 3, label: 'Tanda Tangan' },
      { num: 4, label: 'Selesai' }
    ];
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
          {steps.map((s, idx) => (
            <div key={idx} className="flex flex-col items-center bg-white px-2">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300
                  ${step >= idx 
                    ? 'bg-indo-red border-indo-red text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
                  }`}
              >
                {step > idx ? <CheckCircle className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-xs mt-1 font-medium ${step >= idx ? 'text-indo-red' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-slate-100 shadow-sm">
                <img 
                  src="https://drive.google.com/thumbnail?id=1K2yC1z5D8P-gD_5C5_7_4y4y4y4y4y4y&sz=s200" 
                  alt="Logo"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 bg-indo-red text-white flex items-center justify-center font-bold text-lg" style={{display:'none'}}>
                  I
                </div>
             </div>
             <div>
               <h1 className="text-lg font-bold text-slate-900 leading-tight">
                 Gerakan Nasional
               </h1>
               <p className="text-xs text-indo-red font-bold tracking-wider">APARATUR DESA ASN 2026</p>
             </div>
          </div>
          <a 
            href={DRIVE_URL}
            target="_blank"
            rel="noopener noreferrer" 
            className="text-xs font-medium text-gray-500 hover:text-indo-red flex items-center gap-1"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Info Validasi</span>
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <PetitionStats />
            <ExportManager />
            <SignerList />
          </div>

          {/* Main Form Area */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-indo-red px-6 py-4">
                <h2 className="text-white font-bold text-xl flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Formulir Pernyataan Sikap
                </h2>
                <p className="text-red-100 text-sm mt-1">
                  Isi data dengan benar untuk validitas tuntutan nasional.
                </p>
              </div>

              <div className="p-6 sm:p-8">
                {step !== FormStep.SUCCESS && renderProgressBar()}

                {/* Step 1: Details */}
                {step === FormStep.DETAILS && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-gray-700 font-semibold border-b pb-2">
                         <User className="w-5 h-5 text-indo-red" />
                         <h3>Identitas Diri</h3>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap (Sesuai KTP)</label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indo-red focus:border-indo-red transition-all"
                          placeholder="Contoh: Budi Santoso"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan di Desa</label>
                        <select
                          value={formData.position}
                          onChange={(e) => setFormData({...formData, position: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indo-red focus:border-indo-red transition-all bg-white"
                        >
                          <option value="">-- Pilih Jabatan --</option>
                          {VILLAGE_POSITIONS.map((pos) => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleNext}
                      className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                      Lanjut ke Alamat <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* Step 2: Address */}
                {step === FormStep.ADDRESS && (
                  <div className="space-y-6 animate-fade-in">
                    <AddressSelectors 
                      onAddressChange={(p, r, d, v) => setFormData({
                        ...formData, 
                        province: p, 
                        regency: r, 
                        district: d, 
                        village: v
                      })}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(FormStep.DETAILS)}
                        className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                      >
                        Kembali
                      </button>
                      <button
                        onClick={handleNext}
                        className="w-2/3 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                      >
                        Lanjut Tanda Tangan <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Signature */}
                {step === FormStep.SIGNATURE && (
                  <div className="space-y-6 animate-fade-in">
                     <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <h4 className="font-bold text-indo-red mb-2 flex items-center gap-2">
                          <Flag className="w-5 h-5" />
                          Pernyataan Sikap:
                        </h4>
                        <p className="text-gray-800 text-lg font-serif italic">
                          "{FIXED_REASON}"
                        </p>
                     </div>

                     <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Tanda Tangan Digital</label>
                        <SignaturePad 
                          onSign={handleSign} 
                          onClear={() => setFormData({...formData, signature: ''})} 
                        />
                     </div>

                     <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setStep(FormStep.ADDRESS)}
                        className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                      >
                        Kembali
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.signature}
                        className="w-2/3 bg-indo-red text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                        Kirim Pernyataan
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Success & Download */}
                {step === FormStep.SUCCESS && (
                  <div className="text-center space-y-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-2">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Terima Kasih!</h3>
                      <p className="text-gray-500 mt-2">
                        Pernyataan sikap Anda telah berhasil disimpan dan dicatat dalam database nasional.
                      </p>
                    </div>

                    {/* Preview Surat */}
                    <div className="overflow-hidden bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-500 mb-4 flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" /> Preview Dokumen Digital
                      </p>
                      
                      <div className="overflow-x-auto flex justify-center pb-4">
                        {/* THE LETTER - This div is captured by html2canvas */}
                        <div 
                           ref={letterRef}
                           data-pdf-content="true"
                           className="bg-white w-[210mm] min-h-[297mm] p-[25mm] text-left shadow-lg mx-auto relative text-black"
                           style={{ fontFamily: 'Times New Roman, serif' }}
                        >
                           {/* Header Bar */}
                           <div className="w-full h-1.5 bg-[#A3191C] mb-6"></div>
                           
                           {/* Letter Head */}
                           <div className="text-center mb-8">
                             <h1 className="text-3xl font-bold text-[#0f172a] mb-2 tracking-wide uppercase">PERNYATAAN SIKAP</h1>
                             <h2 className="text-sm font-normal text-[#0f172a] uppercase tracking-[0.25em]">GERAKAN NASIONAL APARATUR DESA</h2>
                             <div className="mt-4 border-b-2 border-black mb-1"></div>
                             <div className="border-b border-black"></div>
                           </div>

                           {/* Body */}
                           <div className="font-sans text-lg leading-relaxed space-y-6">
                              <div>
                                <p>Kepada Yth,</p>
                                <p className="font-bold">Bapak Presiden Republik Indonesia</p>
                                <p>di Jakarta</p>
                              </div>

                              <p>Dengan hormat,</p>
                              <p>Saya yang bertanda tangan di bawah ini:</p>

                              <table className="w-full ml-4">
                                <tbody>
                                  <tr>
                                    <td className="w-32 py-1 align-top">Nama</td>
                                    <td className="w-4 py-1 align-top">:</td>
                                    <td className="py-1 font-bold align-top uppercase">{formData.fullName}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1 align-top">Jabatan</td>
                                    <td className="py-1 align-top">:</td>
                                    <td className="py-1 font-bold align-top">{formData.position}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1 align-top">Alamat</td>
                                    <td className="py-1 align-top">:</td>
                                    <td className="py-1 align-top uppercase">
                                      DS. {formData.village?.name}, KEC. {formData.district?.name},<br/>
                                      {formData.regency?.name}, {formData.province?.name}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>

                              <p className="text-justify indent-8">
                                Dengan ini menyatakan sikap untuk mendukung penuh dan 
                                "Menuntut kepastian status kepegawaian sebagai ASN Desa dalam UU ASN 2026" 
                                sebagai upaya menjamin kesejahteraan dan kepastian hukum bagi pelayan masyarakat di tingkat desa.
                              </p>

                              <div className="py-4 text-center">
                                <p className="font-serif italic font-bold text-[#A3191C] text-xl px-8 leading-relaxed">
                                  "Kami akan memenuhi jalanan Jakarta, jika Tuntutan ini tidak Negara Dengarkan dan Penuhi."
                                </p>
                              </div>

                              <p className="text-justify">
                                Demikian pernyataan sikap ini saya buat dengan kesadaran penuh dan tanpa paksaan dari pihak manapun sebagai bentuk aspirasi konstitusional.
                              </p>
                           </div>

                           {/* Signature Section */}
                           <div className="mt-16 flex justify-end">
                             <div className="text-center min-w-[200px]">
                               <p className="mb-1 font-sans uppercase">{formData.village?.name || 'Tempat'}, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month:'long', year:'numeric'})}</p>
                               <p className="mb-4 font-sans">Hormat Saya,</p>
                               <div className="h-24 flex items-center justify-center my-2">
                                  {formData.signature && (
                                    <img src={formData.signature} alt="Tanda Tangan" className="max-h-full max-w-full" />
                                  )}
                               </div>
                               <p className="font-bold border-b border-black inline-block min-w-[150px] uppercase font-sans">{formData.fullName}</p>
                               <p className="text-sm mt-1 font-sans">{formData.position}</p>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Buat Baru
                      </button>
                      <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="px-6 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg"
                      >
                        {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        Unduh Bukti PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
