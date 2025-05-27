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
  const letterCountRef = useRef(0);

  const [context, setContext] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isPendingRecognition, setIsPendingRecognition] = useState(false);
  const [recognizedLetter, setRecognizedLetter] = useState('');
  const [isTiming, setIsTiming] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [finalWpm, setFinalWpm] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = CANVAS_CONFIG.strokeStyle;
    ctx.lineWidth = CANVAS_CONFIG.lineWidth;
    ctx.lineCap = CANVAS_CONFIG.lineCap;
    setContext(ctx);

    letterCountRef.current = 0;
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
      const worker = await createWorker();

      const imageData = canvasRef.current.toDataURL('image/png');

      const { data } = await worker.recognize(imageData, {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        tessedit_pageseg_mode: '10',
      });

      const result = data.text.trim();
      const letter = result.charAt(0);

      if (/^[A-Za-z]$/.test(letter)) {
        setRecognizedLetter(letter);
        handleTitleChange(prevTitle => prevTitle + letter);
        context?.clearRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);

        if (isTiming) {
          letterCountRef.current += 1;
        }
      } else {
        setRecognizedLetter('?');
        clearCanvas();
      }

      await worker.terminate();
    } catch (error) {
      console.error('Recognition error:', error);
      setRecognizedLetter('?');
      clearCanvas();
    } finally {
      setIsRecognizing(false);
    }
  };

  const startSession = () => {
    setIsTiming(true);
    setStartTime(Date.now());
    letterCountRef.current = 0;
    setFinalWpm(null);
  };

  const endSession = () => {
    setIsTiming(false);
    if (startTime) {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      const calculatedWpm = elapsedMinutes > 0 ? (letterCountRef.current / 5) / elapsedMinutes : 0;
      setFinalWpm(calculatedWpm.toFixed(2));
    }
  };

  const buttonStyle = {
    padding: '5px 10px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  return (
    <div className="writing-tablet" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
        <button onClick={startSession} style={buttonStyle}>Start</button>
        <button onClick={endSession} style={buttonStyle}>End</button>
        <button onClick={clearCanvas} style={{ ...buttonStyle, backgroundColor: '#f44336' }}>Clear</button>
      </div>

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
        {finalWpm !== null && (
          <div>
            Your WPM: <strong>{finalWpm}</strong>
          </div>
        )}
        <div>
          {isRecognizing ? (
            <span>Recognizing...</span>
          ) : (
            recognizedLetter === '?' ? (
              <span style={{ color: 'red', cursor: 'pointer' }} onClick={clearCanvas}>
                Recognition failed, canvas cleared, please try again
              </span>
            ) : (
              <span>Recognized Letter: <strong>{recognizedLetter}</strong></span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default WritingTablet;
