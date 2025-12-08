import React, { useRef, useState, useEffect } from "react";

const FaceCaptureModal = ({
  isOpen,
  onCapture,
  onClose,
  title = "Capture Selfie",
  subtitle = "Face Verification Required",
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && !cameraActive) {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
      console.error("Camera error:", err);
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    // Flip the image horizontally
    context.scale(-1, 1);
    context.drawImage(videoRef.current, -canvasRef.current.width, 0);

    // Convert to blob and preview
    canvasRef.current.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setPreviewImage(url);
      onCapture(blob);
    }, "image/jpeg");
  };

  const retakePhoto = () => {
    setPreviewImage(null);
  };

  const handleClose = () => {
    setPreviewImage(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Video/Preview Container */}
        <div className="relative bg-black rounded-xl overflow-hidden mb-6 aspect-video">
          {!previewImage ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover scale-x-[-1]"
              autoPlay
              playsInline
              muted
            />
          ) : (
            <img
              src={previewImage}
              alt="Captured selfie"
              className="w-full h-full object-cover"
            />
          )}

          {/* Guide Overlay */}
          {!previewImage && (
            <div className="absolute inset-0 border-4 border-yellow-400 opacity-30 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-48 border-2 border-green-400 rounded-full opacity-50"></div>
            </div>
          )}
        </div>

        {/* Hidden Canvas for Capture */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Buttons */}
        <div className="flex gap-3">
          {!previewImage ? (
            <>
              <button
                onClick={captureSelfie}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                📸 Capture
              </button>
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={retakePhoto}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                🔄 Retake
              </button>
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center mt-4">
          ✓ Ensure good lighting • ✓ Face clearly visible • ✓ No masks/glasses
        </p>
      </div>
    </div>
  );
};

export default FaceCaptureModal;
