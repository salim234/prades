import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from './services/supabaseClient';
import { AddressSelectors } from './components/AddressSelectors';
import { SignaturePad } from './components/SignaturePad';
import { PetitionStats } from './components/PetitionStats';
import { SignerList } from './components/SignerList';
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
        signature: formData.signature // storing base64 directly as per schema discussion
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
        scale: 1.5, // Lower scale to reduce file size (1.5 is decent for A4 print)
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        // Clone document to modify styles for capture without affecting UI
        onclone: (clonedDoc) => {
           // Find the element in the cloned document
           // We look for the div that has the shadow/border classes we want to strip
           const element = clonedDoc.querySelector('[data-pdf-content="true"]') as HTMLElement;
           if (element) {
             element.style.boxShadow = 'none'; // Remove shadow for clean print look
             element.style.transform = 'none'; // Remove any transforms
             element.style.margin = '0'; // Reset margins to avoid offset
           }
        }
      });
      
      // Use JPEG with 0.75 quality to significantly reduce file size compared to PNG
      const imgData = canvas.toDataURL('image/jpeg', 0.75);

      // 2. Initialize PDF (A4 Portrait)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // 3. Define Margins
      const margin = 15; // 15mm margin
      const printableWidth = pdfWidth - (margin * 2);
      const printableHeight = pdfHeight - (margin * 2);

      // 4. Calculate dimensions to fit A4
      const imgProps = pdf.getImageProperties(imgData);
      
      let renderWidth = printableWidth;
      let renderHeight = (imgProps.height * printableWidth) / imgProps.width;

      // If the height is still too tall, scale based on height
      if (renderHeight > printableHeight) {
        renderHeight = printableHeight;
        renderWidth = (imgProps.width * printableHeight) / imgProps.height;
      }

      // Center horizontally
      const xOffset = (pdfWidth - renderWidth) / 2;
      const yOffset = margin; // Top margin

      // 5. Add image to PDF (JPEG format)
      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidth, renderHeight);

      // 6. Save PDF
      pdf.save(`Pernyataan_Sikap_${formData.fullName.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
      console.error("Download error:", error);
      alert("Maaf, terjadi kesalahan saat membuat PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-slate-50">
      {/* Header / Hero */}
      <header className="bg-gradient-to-r from-indo-red to-indo-red-dark text-white pt-10 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://picsum.photos/1200/400')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          
          <div className="flex justify-center mb-6">
            <img 
              src="https://drive.google.com/thumbnail?id=10E957ZdhUc_tlBWwxUlCoh0AtOXMtlMn&sz=w1000" 
              alt="Logo PPDI" 
              className="h-24 md:h-32 object-contain drop-shadow-lg"
            />
          </div>

          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-white/20">
            <Flag className="w-3 h-3 mr-2" />
            GERAKAN NASIONAL APARATUR DESA
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4 leading-tight">
            Tuntut Keadilan:<br/>
            Masuk UU ASN 2026
          </h1>
          <p className="text-lg md:text-xl text-red-50 max-w-2xl mx-auto font-light">
            Bersama kita perjuangkan hak dan status kepegawaian Aparatur Pemerintah Desa demi masa depan yang lebih terjamin.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 -mt-10 relative z-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Stats & Signer List */}
          <div className="lg:col-span-1 space-y-6">
            <PetitionStats />
            
            {/* List Penandatangan */}
            <SignerList />
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-indo-red" />
                Mengapa ini penting?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Aparatur Desa adalah garda terdepan pelayanan publik. Namun, status kepegawaian mereka seringkali tidak jelas. 
                Revisi UU ASN 2026 adalah momentum emas untuk menetapkan standar kesejahteraan yang layak.
              </p>
            </div>
          </div>

          {/* Right Column: The Petition Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100">
              
              {/* Progress Stepper (Tab Layout) */}
              {step !== FormStep.SUCCESS && (
                <div className="flex bg-white border-b border-gray-200">
                   {/* Step 1: Data Diri */}
                   <div className={`flex-1 py-4 flex flex-col sm:flex-row items-center justify-center transition-colors duration-200 border-b-2 ${
                     step >= FormStep.DETAILS 
                       ? 'border-indo-red text-indo-red bg-red-50/10' 
                       : 'border-transparent text-slate-400'
                   }`}>
                     <User className={`w-5 h-5 mb-1 sm:mb-0 sm:mr-2 ${step >= FormStep.DETAILS ? 'stroke-[2.5px]' : ''}`} />
                     <span className="font-semibold text-xs sm:text-sm tracking-wide">Data Diri</span>
                   </div>

                   {/* Step 2: Alamat */}
                   <div className={`flex-1 py-4 flex flex-col sm:flex-row items-center justify-center transition-colors duration-200 border-b-2 ${
                     step >= FormStep.ADDRESS 
                       ? 'border-indo-red text-indo-red bg-red-50/10' 
                       : 'border-transparent text-slate-400'
                   }`}>
                     <MapPin className={`w-5 h-5 mb-1 sm:mb-0 sm:mr-2 ${step >= FormStep.ADDRESS ? 'stroke-[2.5px]' : ''}`} />
                     <span className="font-semibold text-xs sm:text-sm tracking-wide">Alamat</span>
                   </div>

                   {/* Step 3: Tanda Tangan */}
                   <div className={`flex-1 py-4 flex flex-col sm:flex-row items-center justify-center transition-colors duration-200 border-b-2 ${
                     step >= FormStep.SIGNATURE 
                       ? 'border-indo-red text-indo-red bg-red-50/10' 
                       : 'border-transparent text-slate-400'
                   }`}>
                     <Signature className={`w-5 h-5 mb-1 sm:mb-0 sm:mr-2 ${step >= FormStep.SIGNATURE ? 'stroke-[2.5px]' : ''}`} />
                     <span className="font-semibold text-xs sm:text-sm tracking-wide">Pernyataan Sikap</span>
                   </div>
                </div>
              )}

              <div className="p-6 md:p-8">
                {step === FormStep.DETAILS && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-bold text-slate-800">Identitas Penandatangan</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap (Sesuai KTP)</label>
                      <input
                        type="text"
                        className="w-full rounded-md border-gray-300 border p-3 focus:ring-indo-red focus:border-indo-red transition-shadow shadow-sm"
                        placeholder="Contoh: Budi Santoso"
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Jabatan di Desa</label>
                      <select
                        className="w-full rounded-md border-gray-300 border p-3 focus:ring-indo-red focus:border-indo-red shadow-sm bg-white"
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                      >
                        <option value="">-- Pilih Jabatan --</option>
                        {VILLAGE_POSITIONS.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleNext}
                      className="w-full bg-indo-red hover:bg-indo-red-dark text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-red-200 flex items-center justify-center"
                    >
                      Lanjut ke Alamat
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                )}

                {step === FormStep.ADDRESS && (
                  <div className="space-y-6 animate-fade-in">
                     <h2 className="text-2xl font-bold text-slate-800">Verifikasi Wilayah</h2>
                     <p className="text-slate-500 text-sm">Pastikan data wilayah sesuai dengan data Kemendagri agar pernyataan sikap valid.</p>
                     
                     <AddressSelectors
                       onAddressChange={(p, r, d, v) => setFormData({
                         ...formData,
                         province: p,
                         regency: r,
                         district: d,
                         village: v
                       })}
                     />

                     <div className="flex gap-3 pt-4">
                       <button
                         onClick={() => setStep(FormStep.DETAILS)}
                         className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
                       >
                         Kembali
                       </button>
                       <button
                         onClick={handleNext}
                         className="flex-1 bg-indo-red hover:bg-indo-red-dark text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-red-200 flex items-center justify-center"
                       >
                         Lanjut
                         <ChevronRight className="w-5 h-5 ml-2" />
                       </button>
                     </div>
                  </div>
                )}

                {step === FormStep.SIGNATURE && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-2xl font-bold text-slate-800">Pernyataan Sikap</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Pernyataan yang ditandatangani
                      </label>
                      
                      <div className="p-5 bg-red-50 border border-red-100 rounded-lg shadow-inner">
                        <div className="flex gap-3">
                           <div className="flex-shrink-0 mt-1">
                              <ShieldCheck className="w-5 h-5 text-indo-red" />
                           </div>
                           <p className="text-lg font-serif font-medium text-indo-red-dark leading-relaxed">
                             "{FIXED_REASON}"
                           </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tanda Tangan Digital</label>
                      <SignaturePad 
                        onSign={handleSign} 
                        onClear={() => setFormData(prev => ({...prev, signature: ''}))}
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                      Dengan menekan tombol di bawah, saya menyatakan data yang saya isi adalah benar dan saya mendukung penuh pernyataan sikap ini.
                    </div>

                    <div className="flex gap-3 pt-2">
                       <button
                         onClick={() => setStep(FormStep.ADDRESS)}
                         className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
                       >
                         Kembali
                       </button>
                       <button
                         onClick={handleSubmit}
                         disabled={!formData.signature || isSubmitting}
                         className="flex-1 bg-indo-red hover:bg-indo-red-dark disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-red-200 flex items-center justify-center"
                       >
                         {isSubmitting ? (
                           <>
                             <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                             Menyimpan...
                           </>
                         ) : (
                           <>
                             <FileText className="w-5 h-5 mr-2" />
                             Tandatangani Pernyataan Sikap
                           </>
                         )}
                       </button>
                     </div>
                  </div>
                )}

                {step === FormStep.SUCCESS && (
                   <div className="text-center py-10 animate-fade-in">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-2">Terima Kasih!</h2>
                      <p className="text-slate-600 mb-8 max-w-md mx-auto">
                        Aspirasi Anda telah kami rekam dalam bentuk dokumen resmi.
                      </p>

                      {/* Dokumen Pernyataan Sikap */}
                      <div 
                        ref={letterRef} 
                        data-pdf-content="true"
                        className="bg-white p-8 md:p-12 rounded-sm shadow-2xl border border-gray-200 max-w-2xl mx-auto mb-8 text-left relative transform transition-all duration-300 font-serif"
                      >
                        {/* Header aksen kertas */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indo-red to-indo-red-dark"></div>
                        
                        {/* Kop Surat Sederhana */}
                        <div className="text-center mb-8 border-b-4 border-double border-slate-800 pb-4 pt-2">
                            <h1 className="font-bold text-2xl md:text-3xl text-slate-900 tracking-wide mb-1">PERNYATAAN SIKAP</h1>
                            <p className="text-xs md:text-sm font-bold text-slate-600 uppercase tracking-[0.3em]">Gerakan Nasional Aparatur Desa</p>
                        </div>

                        {/* Tujuan Surat */}
                        <div className="mb-8 text-base text-slate-900 leading-relaxed">
                            <p>Kepada Yth,</p>
                            <p className="font-bold">Bapak Presiden Republik Indonesia</p>
                            <p>di Jakarta</p>
                        </div>

                        {/* Isi Surat */}
                        <div className="text-sm md:text-base text-slate-900 space-y-4 leading-relaxed text-justify">
                            <p>Dengan hormat,</p>
                            <p>Saya yang bertanda tangan di bawah ini:</p>

                            {/* Tabel Data Diri Rapi */}
                            <div className="pl-0 md:pl-4 my-4">
                                <table className="w-full text-sm md:text-base">
                                    <tbody>
                                        <tr>
                                            <td className="w-24 md:w-32 py-1 align-top text-slate-700">Nama</td>
                                            <td className="w-4 py-1 align-top text-slate-700">:</td>
                                            <td className="py-1 align-top font-bold text-slate-900 uppercase">{formData.fullName}</td>
                                        </tr>
                                        <tr>
                                            <td className="py-1 align-top text-slate-700">Jabatan</td>
                                            <td className="py-1 align-top text-slate-700">:</td>
                                            <td className="py-1 align-top font-bold text-slate-900">{formData.position}</td>
                                        </tr>
                                        <tr>
                                            <td className="py-1 align-top text-slate-700">Alamat</td>
                                            <td className="py-1 align-top text-slate-700">:</td>
                                            <td className="py-1 align-top uppercase leading-relaxed text-slate-900">
                                                DS. {formData.village?.name}, KEC. {formData.district?.name},<br/>
                                                {formData.regency?.name}, {formData.province?.name}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <p className="indent-8">
                                Dengan ini menyatakan sikap untuk mendukung penuh dan <strong className="text-black">"{FIXED_REASON}"</strong> sebagai upaya menjamin kesejahteraan dan kepastian hukum bagi pelayan masyarakat di tingkat desa.
                            </p>

                            <p className="mt-4 font-bold text-indo-red-dark italic text-center">
                                "Kami akan memenuhi jalanan Jakarta, jika Tuntutan ini tidak Negara Dengarkan dan Penuhi."
                            </p>

                            <p>Demikian pernyataan sikap ini saya buat dengan kesadaran penuh dan tanpa paksaan dari pihak manapun sebagai bentuk aspirasi konstitusional.</p>
                        </div>

                        {/* Tanda Tangan */}
                        <div className="mt-16 flex justify-end">
                            <div className="text-center min-w-[200px]">
                                <p className="text-sm text-slate-700 mb-1">
                                    {formData.village?.name || 'Tempat'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-sm text-slate-700 font-bold mb-2">Hormat Saya,</p>
                                
                                <div className="relative h-24 w-full flex items-center justify-center my-2">
                                     {formData.signature && (
                                        <img src={formData.signature} alt="Signature" className="h-full object-contain filter drop-shadow-sm" />
                                     )}
                                </div>
                                
                                <p className="text-base font-bold text-slate-900 border-b border-slate-900 inline-block min-w-full pb-1 uppercase">
                                    {formData.fullName}
                                </p>
                                <p className="text-xs text-slate-600 mt-1">{formData.position}</p>
                            </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4 justify-center max-w-2xl mx-auto mb-4">
                         <button
                           onClick={handleDownload}
                           disabled={isDownloading}
                           className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                         >
                           {isDownloading ? (
                             <>
                               <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                               Memproses PDF...
                             </>
                           ) : (
                             <>
                               <Download className="w-5 h-5 mr-2" />
                               Unduh Dokumen (PDF)
                             </>
                           )}
                         </button>
                         <a
                            href={DRIVE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg flex items-center justify-center"
                        >
                            <UploadCloud className="w-5 h-5 mr-2" />
                            Upload ke Drive
                        </a>
                      </div>
                      <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">
                        Silakan unduh dokumen PDF terlebih dahulu, kemudian unggah ke Google Drive melalui tombol di atas sebagai arsip nasional.
                      </p>
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