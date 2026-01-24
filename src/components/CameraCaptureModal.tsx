import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, RefreshCw, Loader2 } from 'lucide-react';

interface CameraCaptureModalProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export default function CameraCaptureModal({
  onCapture,
  onCancel,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    
    async function startCamera() {
      try {
        setLoading(true);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' } // Prefer rear camera on mobile
        });
        
        if (active) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Camera access error:", err);
        if (active) {
          setError("Could not access camera. Please ensure you have granted permission.");
          setLoading(false);
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      // Stop all tracks when unmounting
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = async () => {
    if (capturedImage) {
      try {
        // Convert Data URL to Blob/File
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        
        // Generate a filename
        const filename = `photo_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });
        
        onCapture(file);
      } catch (e) {
        console.error("Error converting image:", e);
        setError("Failed to process image.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center text-white bg-black/50 absolute top-0 left-0 right-0 z-10">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Camera size={20} />
          Take Photo
        </h2>
        <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-full">
          <X size={24} />
        </button>
      </div>

      {/* Main Content (Video or Image) */}
      <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
        {error ? (
          <div className="text-white text-center p-6">
            <p className="mb-4 text-red-400">{error}</p>
            <button 
              onClick={onCancel}
              className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
            />
            
            {/* Captured Image Preview */}
            {capturedImage && (
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-full object-contain"
              />
            )}

            {/* Hidden Canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {loading && !capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      {!error && (
        <div className="p-8 bg-black/80 flex justify-center gap-8 items-center pb-12">
          {!capturedImage ? (
            // Capture Mode
            <button
              onClick={handleCapture}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Capture photo"
            >
              <div className="w-16 h-16 bg-white rounded-full" />
            </button>
          ) : (
            // Review Mode
            <>
              <button
                onClick={handleRetake}
                className="flex flex-col items-center gap-2 text-white hover:text-blue-300 transition-colors"
              >
                <div className="p-4 bg-slate-700 rounded-full">
                  <RefreshCw size={24} />
                </div>
                <span className="text-sm font-medium">Retake</span>
              </button>

              <button
                onClick={handleConfirm}
                className="flex flex-col items-center gap-2 text-white hover:text-green-300 transition-colors"
              >
                <div className="p-4 bg-blue-600 rounded-full">
                  <Check size={24} />
                </div>
                <span className="text-sm font-medium">Use Photo</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
