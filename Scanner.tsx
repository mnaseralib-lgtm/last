import React, { useState, useEffect, useRef, useCallback } from 'react';
import { postAttendance } from '../services/googleSheetsService';
import { AttendanceResponse } from '../types';
import { FlashIcon } from './icons';

// Declare html5QrCode in the window scope
declare global {
    interface Window {
        Html5Qrcode: any;
    }
}
const QR_READER_ID = "qr-reader";

type ActionType = 'دخول' | 'خروج' | 'خروج مسائي';

// Create AudioContext once.
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

/** Plays a short, high-pitched beep sound. */
const playBeep = () => {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.15);
};

interface ScannerProps {
    onScanSuccess: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanSuccess }) => {
    const [message, setMessage] = useState<{ text: string, type: 'error' } | null>(null);
    const [loadingCount, setLoadingCount] = useState(0);
    const [selectedAction, setSelectedAction] = useState<ActionType>('دخول');
    const [manualHrCode, setManualHrCode] = useState<string>('');
    const [successInfo, setSuccessInfo] = useState<{ name: string; department: string; message: string } | null>(null);
    const [isFlashOn, setIsFlashOn] = useState(false);
    
    const scannerRef = useRef<any>(null);
    const processingRef = useRef(new Set<string>());
    
    const DEBOUNCE_DELAY_MS = 1500; // 1.5 seconds
    const isLoading = loadingCount > 0;

    // Refs to hold latest values for callbacks without re-triggering useEffect
    const onScanSuccessRef = useRef(onScanSuccess);
    useEffect(() => { onScanSuccessRef.current = onScanSuccess; }, [onScanSuccess]);
    
    const selectedActionRef = useRef(selectedAction);
    useEffect(() => { selectedActionRef.current = selectedAction; }, [selectedAction]);

    const handleAttendanceSuccess = useCallback((response: AttendanceResponse, code: string) => {
        onScanSuccessRef.current();
        setSuccessInfo({
            name: response.employee?.name || code, 
            department: response.employee?.department || 'تم التسجيل بنجاح',
            message: response.message,
        });

        setTimeout(() => {
            setSuccessInfo(prev => (prev && (prev.name === (response.employee?.name || code)) ? null : prev));
        }, DEBOUNCE_DELAY_MS);
    }, []);

    const handleAttendanceError = useCallback((error: unknown, code: string) => {
        const errorMessage = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
        const fullMessage = `فشل لـ ${code}: ${errorMessage}`;
        setMessage({ text: fullMessage, type: 'error' });
        setTimeout(() => {
            setMessage(prev => (prev && prev.text === fullMessage ? null : prev));
        }, DEBOUNCE_DELAY_MS + 1500);
    }, []);
    
    const toggleFlash = useCallback(async () => {
        if (!scannerRef.current) return;
        const newFlashState = !isFlashOn;
        try {
            await scannerRef.current.applyVideoConstraints({
                advanced: [{ torch: newFlashState }],
            });
            setIsFlashOn(newFlashState);
        } catch (err) {
            console.error("Failed to toggle flash", err);
            setMessage({ text: "الفلاش غير مدعوم على هذا الجهاز.", type: 'error' });
            setTimeout(() => setMessage(null), 2000);
        }
    }, [isFlashOn]);

    useEffect(() => {
        const html5QrCode = new window.Html5Qrcode(QR_READER_ID);
        scannerRef.current = html5QrCode;

        const qrCodeSuccessCallback = async (decodedText: string) => {
            if (processingRef.current.has(decodedText)) {
                return;
            }
            
            // --- IMMEDIATE FEEDBACK ---
            playBeep();
            processingRef.current.add(decodedText);
            setLoadingCount(p => p + 1);
            setMessage(null);
            setSuccessInfo({
                name: decodedText,
                department: 'جاري المعالجة...',
                message: 'لحظات من فضلك',
            });
            // --- END IMMEDIATE FEEDBACK ---

            try {
                const response = await postAttendance(decodedText, selectedActionRef.current);
                handleAttendanceSuccess(response, decodedText);
            } catch (error) {
                setSuccessInfo(null);
                handleAttendanceError(error, decodedText);
            } finally {
                setLoadingCount(p => p - 1);
                 setTimeout(() => {
                    processingRef.current.delete(decodedText);
                }, DEBOUNCE_DELAY_MS);
            }
        };

        const qrCodeErrorCallback = (errorMessage: string) => {
            if (!errorMessage.toLowerCase().includes("qr code parse error")) {
                // console.error(`QR Code scanning error: ${errorMessage}`);
            }
        };

        const startScanner = async () => {
            try {
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                    qrCodeSuccessCallback,
                    qrCodeErrorCallback
                );
            } catch (err: any) {
                const errorMessage = err.message || "لا يمكن تشغيل الكاميرا. يرجى التحقق من الأذونات.";
                setMessage({ text: errorMessage, type: 'error' });
            }
        };

        startScanner();

        return () => {
             if (scannerRef.current && scannerRef.current.isScanning) {
                html5QrCode.stop().catch((err: any) => console.error("Failed to stop QR scanner", err));
             }
        };
    }, [handleAttendanceError, handleAttendanceSuccess]);

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = manualHrCode.trim();
        if (!code || isLoading) return;
        
        // --- IMMEDIATE FEEDBACK ---
        playBeep();
        setLoadingCount(p => p + 1);
        processingRef.current.add(code);
        setMessage(null);
        setSuccessInfo({
            name: code,
            department: 'جاري المعالجة...',
            message: 'لحظات من فضلك',
        });
        // --- END IMMEDIATE FEEDBACK ---

        try {
            const response = await postAttendance(code, selectedAction);
            handleAttendanceSuccess(response, code);
            setManualHrCode('');
        } catch (error) {
            setSuccessInfo(null);
            handleAttendanceError(error, code);
        } finally {
            setLoadingCount(p => p - 1);
            setTimeout(() => {
                processingRef.current.delete(code);
            }, DEBOUNCE_DELAY_MS);
        }
    };

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            <div className="p-4 bg-white rounded-xl shadow-md space-y-4">
                <h2 className="text-lg font-bold text-gray-700">1. اختر الإجراء</h2>
                <div className="relative">
                    <select
                        value={selectedAction}
                        onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                        className="w-full appearance-none bg-green-600 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        aria-label="اختر نوع التسجيل"
                    >
                        <option value="دخول">دخول</option>
                        <option value="خروج">خروج</option>
                        <option value="خروج مسائي">خروج مسائي</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-white">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-md space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-700">2. امسح الرمز</h2>
                    <button 
                        onClick={toggleFlash} 
                        className={`p-2 rounded-full transition-colors duration-200 ${isFlashOn ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-600'}`}
                        aria-label="تشغيل/إيقاف الفلاش"
                    >
                        <FlashIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div id={QR_READER_ID} className="w-full rounded-lg overflow-hidden border-2 border-gray-200 aspect-square max-h-[50vh]"></div>

                {message && (
                    <div className={`p-3 text-center rounded-md text-white font-semibold animate-fade-in-up ${message.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                        {message.text}
                    </div>
                )}
                 {successInfo && (
                    <div className="p-4 text-center rounded-md text-white font-semibold bg-green-500 animate-fade-in-up">
                        <p className="font-bold text-lg">{successInfo.name}</p>
                        <p>{successInfo.department}</p>
                        <p className="text-sm opacity-90">{successInfo.message}</p>
                    </div>
                )}
            </div>

            <div className="p-4 bg-white rounded-xl shadow-md space-y-4">
                 <h2 className="text-lg font-bold text-gray-700">أو التسجيل اليدوي</h2>
                 <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row items-stretch gap-2">
                    <input 
                        type="text" 
                        value={manualHrCode}
                        onChange={(e) => setManualHrCode(e.target.value)}
                        placeholder="ادخل الرقم الوظيفي..." 
                        className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !manualHrCode.trim()} className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-2 px-6 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition duration-300">
                        تسجيل
                    </button>
                 </form>
            </div>
        </div>
    );
};

export default Scanner;