'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sliders, Move, ZoomIn, ZoomOut, RotateCw,
  Layers, Eye, EyeOff, Download, Maximize2
} from 'lucide-react';

interface ImageOverlayCompareProps {
  leftImage: string;
  rightImage: string;
  leftLabel?: string;
  rightLabel?: string;
  onClose?: () => void;
}

export function ImageOverlayCompare({
  leftImage,
  rightImage,
  leftLabel = '画像1',
  rightLabel = '画像2',
  onClose
}: ImageOverlayCompareProps) {
  const [mode, setMode] = useState<'slider' | 'overlay' | 'difference'>('slider');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [opacity, setOpacity] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [showLabels, setShowLabels] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mode === 'difference' && canvasRef.current) {
      renderDifferenceMode();
    }
  }, [mode, leftImage, rightImage]);

  const renderDifferenceMode = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img1 = new Image();
    const img2 = new Image();

    img1.crossOrigin = 'anonymous';
    img2.crossOrigin = 'anonymous';

    await Promise.all([
      new Promise((resolve) => {
        img1.onload = resolve;
        img1.src = leftImage;
      }),
      new Promise((resolve) => {
        img2.onload = resolve;
        img2.src = rightImage;
      })
    ]);

    // Set canvas size
    canvas.width = Math.max(img1.width, img2.width);
    canvas.height = Math.max(img1.height, img2.height);

    // Draw first image
    ctx.drawImage(img1, 0, 0);
    const imageData1 = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Draw second image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img2, 0, 0);
    const imageData2 = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Calculate difference
    const diffData = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < imageData1.data.length; i += 4) {
      const diff = Math.abs(imageData1.data[i] - imageData2.data[i]) +
                   Math.abs(imageData1.data[i + 1] - imageData2.data[i + 1]) +
                   Math.abs(imageData1.data[i + 2] - imageData2.data[i + 2]);

      if (diff > 30) { // Threshold for difference
        diffData.data[i] = 255;     // Red channel
        diffData.data[i + 1] = 0;   // Green channel
        diffData.data[i + 2] = 0;   // Blue channel
        diffData.data[i + 3] = 128; // Alpha channel
      } else {
        diffData.data[i] = imageData1.data[i];
        diffData.data[i + 1] = imageData1.data[i + 1];
        diffData.data[i + 2] = imageData1.data[i + 2];
        diffData.data[i + 3] = imageData1.data[i + 3];
      }
    }

    ctx.putImageData(diffData, 0, 0);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(parseInt(e.target.value));
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpacity(parseInt(e.target.value));
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 25, 50));
  };

  const handleReset = () => {
    setZoom(100);
    setPosition({ x: 0, y: 0 });
    setSliderPosition(50);
    setOpacity(50);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const downloadComparison = () => {
    if (mode === 'difference' && canvasRef.current) {
      const link = document.createElement('a');
      link.download = `comparison_${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-semibold">画像比較</h3>

            {/* Mode Selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('slider')}
                className={`px-3 py-1 rounded text-sm ${
                  mode === 'slider' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                スライダー
              </button>
              <button
                onClick={() => setMode('overlay')}
                className={`px-3 py-1 rounded text-sm ${
                  mode === 'overlay' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                オーバーレイ
              </button>
              <button
                onClick={() => setMode('difference')}
                className={`px-3 py-1 rounded text-sm ${
                  mode === 'difference' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                差分
              </button>
            </div>
          </div>

          {/* Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 w-12 text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowLabels(!showLabels)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            {mode === 'difference' && (
              <button
                onClick={downloadComparison}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg ml-2"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Image Container */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-gray-100"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          >
            {mode === 'slider' && (
              <div className="relative" style={{ width: '100%', height: '100%' }}>
                <img
                  src={leftImage}
                  alt={leftLabel}
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img
                    src={rightImage}
                    alt={rightLabel}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <Move className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </div>
            )}

            {mode === 'overlay' && (
              <div className="relative">
                <img
                  src={leftImage}
                  alt={leftLabel}
                  className="w-full h-full object-contain"
                />
                <img
                  src={rightImage}
                  alt={rightLabel}
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ opacity: opacity / 100 }}
                />
              </div>
            )}

            {mode === 'difference' && (
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full"
              />
            )}

            {/* Labels */}
            {showLabels && mode !== 'difference' && (
              <>
                <div className="absolute top-4 left-4 px-3 py-1 bg-black bg-opacity-50 text-white rounded-lg text-sm">
                  {leftLabel}
                </div>
                <div className="absolute top-4 right-4 px-3 py-1 bg-black bg-opacity-50 text-white rounded-lg text-sm">
                  {rightLabel}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-t bg-gray-50">
          {mode === 'slider' && (
            <div className="flex items-center gap-4">
              <Sliders className="w-4 h-4 text-gray-600" />
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={handleSliderChange}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-12 text-right">
                {sliderPosition}%
              </span>
            </div>
          )}

          {mode === 'overlay' && (
            <div className="flex items-center gap-4">
              <Layers className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">透明度:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={handleOpacityChange}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-12 text-right">
                {opacity}%
              </span>
            </div>
          )}

          {mode === 'difference' && (
            <div className="flex items-center justify-center text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded"></span>
                差分領域が赤色で表示されます
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}