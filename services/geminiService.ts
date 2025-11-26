import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
// Note: In a real app, API_KEY should be handled securely.
// For this environment, we rely on the injected process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateSupportReason = async (position: string, location: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Saya mendukung penuh perjuangan Aparatur Desa agar diakui dalam UU ASN demi kesejahteraan dan kepastian hukum.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Buatkan satu kalimat pernyataan dukungan yang profesional, tegas, dan emosional (maksimal 25 kata) untuk pernyataan sikap "Tuntutan Aparatur Pemerintah Desa Masuk dalam UU ASN 2026".
      
      Profil Penandatangan:
      - Jabatan: ${position}
      - Asal: ${location}

      Kalimat harus dalam Bahasa Indonesia formal, fokus pada pengabdian dan kepastian status. Jangan gunakan tanda kutip.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    // Fallback text if AI fails
    return "Sebagai ujung tombak pemerintahan, kami menuntut keadilan dan pengakuan status ASN yang layak.";
  }
};