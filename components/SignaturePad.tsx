import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  onSign: (dataUrl: string) => void;
  onClear: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSign, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size based on container
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 200; // Fixed height
      }
      
      // Reset context after resize
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling on mobile
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveSignature();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onClear();
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      // Get Data URL (PNG)
      const dataUrl = canvas.toDataURL('image/png');
      
      // Accurate size validation in bytes
      try {
        const base64Data = dataUrl.split(',')[1];
        const binaryString = window.atob(base64Data);
        const sizeInBytes = binaryString.length;
        const maxSize = 50 * 1024; // 50KB

        if (sizeInBytes > maxSize) {
           alert(`Ukuran tanda tangan terlalu besar (${(sizeInBytes / 1024).toFixed(2)} KB). Maksimal 50KB.\nMohon buat tanda tangan yang lebih sederhana.`);
           clearCanvas();
           return;
        }
        
        onSign(dataUrl);
      } catch (e) {
        console.error("Error checking signature size", e);
        // Fallback or ignore if calculation fails, though atob is standard
        onSign(dataUrl);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white touch-none cursor-crosshair overflow-hidden relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full block"
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400">
            <span className="text-sm">Tanda tangan di sini (area ini)</span>
          </div>
        )}
      </div>
      
      <div className="flex justify-between mt-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
        >
          <Eraser className="w-4 h-4 mr-1" />
          Hapus
        </button>
        {hasSignature && (
          <span className="flex items-center text-sm text-green-600">
            <Check className="w-4 h-4 mr-1" />
            Tersimpan
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        *Tanda tangan digital maksimal ukuran 50Kb
      </p>
    </div>
  );
};
