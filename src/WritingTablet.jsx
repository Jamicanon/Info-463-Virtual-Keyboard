import { useRef, useState, useEffect, useCallback } from 'react';
import { createWorker } from 'tesseract.js';

const CANVAS_CONFIG = {
  width: 400,
  height: 400,
  lineWidth: 4,
  strokeStyle: '#000000',
  lineCap: 'round'
};

const RECOGNITION_DELAY = 1000;

function WritingTablet({ handleTitleChange }) {
  const canvasRef = useRef(null);
  const recognitionTimerRef = useRef(null);
  
  const [context, setContext] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isPendingRecognition, setIsPendingRecognition] = useState(false);
  const [recognizedLetter, setRecognizedLetter] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = CANVAS_CONFIG.strokeStyle;
    ctx.lineWidth = CANVAS_CONFIG.lineWidth;
    ctx.lineCap = CANVAS_CONFIG.lineCap;
    setContext(ctx);
  }, []);

  const clearRecognitionTimer = useCallback(() => {
    if (recognitionTimerRef.current) {
      clearTimeout(recognitionTimerRef.current);
      recognitionTimerRef.current = null;
    }
  }, []);

  const clearCanvas = useCallback(() => {
    clearRecognitionTimer();
    context?.clearRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);
    setRecognizedLetter('');
    setIsPendingRecognition(false);
  }, [context, clearRecognitionTimer]);

  const startDrawing = useCallback((e) => {
    if (isPendingRecognition) {
      clearRecognitionTimer();
      setIsPendingRecognition(false);
    }
    const { offsetX, offsetY } = e.nativeEvent;
    context?.beginPath();
    context?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    setRecognizedLetter('');
  }, [context, isPendingRecognition, clearRecognitionTimer]);

  const draw = useCallback((e) => {
    if (!isDrawing || !context) return;
    const { offsetX, offsetY } = e.nativeEvent;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  }, [isDrawing, context]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (isPendingRecognition) return;
    
    setIsPendingRecognition(true);
    recognitionTimerRef.current = setTimeout(async () => {
      await recognizeLetter();
      setIsPendingRecognition(false);
    }, RECOGNITION_DELAY);
  }, [isDrawing, isPendingRecognition]);

  const recognizeLetter = async () => {
    try {
      setIsRecognizing(true);
      const worker = await createWorker('eng');
      
      const imageData = canvasRef.current.toDataURL('image/png');
      
      const { data } = await worker.recognize(imageData, {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        tessedit_pageseg_mode: '7',
      });
      
      const result = data.text.trim().toUpperCase();
      const letter = result.charAt(0);
      
      if (/^[A-Z]$/.test(letter)) {
        setRecognizedLetter(letter);
        handleTitleChange(prevTitle => prevTitle + letter);
        context?.clearRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);
      } else {
        setRecognizedLetter('?');
      }
      
      await worker.terminate();
    } catch (error) {
      console.error('Recognition error:', error);
      setRecognizedLetter('?');
    } finally {
      setIsRecognizing(false);
    }
  };

  return (
    <div className="writing-tablet" style={{ position: 'relative' }}>
      <button
        onClick={clearCanvas}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '5px 10px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1
        }}
      >
        Clear
      </button>
      <canvas
        ref={canvasRef}
        width={CANVAS_CONFIG.width}
        height={CANVAS_CONFIG.height}
        style={{
          border: '1px solid #000',
          backgroundColor: '#fff',
          cursor: 'crosshair',
          display: 'block',
          margin: '0 auto'
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        {isRecognizing ? (
          <div>Recognizing...</div>
        ) : (
          recognizedLetter === '?' && (
            <div onClick={clearCanvas} style={{ color: 'red', cursor: 'pointer' }}>
              Recognition failed, please try again
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default WritingTablet;
