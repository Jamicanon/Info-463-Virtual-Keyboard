import { useRef, useState, useEffect, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import './assets/styles/header.css';

const CANVAS_CONFIG = {
  width: 400,
  height: 400,
  lineWidth: 4,
  strokeStyle: '#000000',
  lineCap: 'round'
};

const RECOGNITION_DELAY = 1000;

function WritingTablet({ handleTitleChange, targetSentence }) {
  const canvasRef = useRef(null);
  const recognitionTimerRef = useRef(null);
  const letterCountRef = useRef(0);

  const [context, setContext] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isPendingRecognition, setIsPendingRecognition] = useState(false);
  const [recognizedLetter, setRecognizedLetter] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [isTiming, setIsTiming] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [finalWpm, setFinalWpm] = useState(null);
  const [finalMsd, setFinalMsd] = useState(null);

  const TARGET_TEXT = targetSentence || '';

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = CANVAS_CONFIG.strokeStyle;
    ctx.lineWidth = CANVAS_CONFIG.lineWidth;
    ctx.lineCap = CANVAS_CONFIG.lineCap;
    setContext(ctx);

    letterCountRef.current = 0;
  }, []);

  function MinimumStringDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0)
    );

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[a.length][b.length];
  }

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
        setRecognizedText(prev => prev + letter);
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
    setFinalMsd(null);
  };

  const endSession = () => {
    setIsTiming(false);
    const endTime = Date.now();

    if (startTime) {
      const elapsedMs = endTime - startTime;
      const elapsedMinutes = elapsedMs / 60000;
      const calculatedWpm = elapsedMinutes > 0 ? (letterCountRef.current / 5) / elapsedMinutes : 0;

      setFinalWpm(calculatedWpm.toFixed(2));

      const msd = MinimumStringDistance(recognizedText, TARGET_TEXT);
      setFinalMsd(msd);

      const sessionData = {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        durationSeconds: (elapsedMs / 1000).toFixed(2),
        wpm: calculatedWpm.toFixed(2),
        minimumStringDistance: msd
      };

      saveData(sessionData);
    }
  };

  const saveData = (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WPMData${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="writing-tablet" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
        <button onClick={startSession} className="start-button">Start</button>
        <button onClick={endSession} className="end-button">End</button>
        <button onClick={clearCanvas} className="clear-button">Clear</button>
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
              <span style={{ color: 'black', cursor: 'pointer' }} onClick={clearCanvas}>
                Recognition failed, canvas cleared, please try again
              </span>
            ) : (
              <span>Recognized Letter: <strong>{recognizedLetter}</strong></span>
            )
          )}
        </div>

        {finalMsd !== null && (
          <div style={{ marginTop: '16px' }}>
            <div>MSD: <strong>{finalMsd}</strong></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WritingTablet;
