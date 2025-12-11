import React, { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';

interface WelcomeScreenProps {
    onStart: (key: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
    const [keyInput, setKeyInput] = useState('');

    useEffect(() => {
        const savedKey = localStorage.getItem('ENGLISH_BUDDY_KEY');
        if (savedKey) setKeyInput(savedKey);
    }, []);

    const handleSubmit = () => {
        if (!keyInput.trim()) return alert("Vui lòng nhập API Key!");
        localStorage.setItem('ENGLISH_BUDDY_KEY', keyInput.trim());
        onStart(keyInput.trim());
    };

    const handleClear = () => {
        localStorage.removeItem('ENGLISH_BUDDY_KEY');
        setKeyInput('');
    };

    return (
        <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center animate-fade-in">
                <div className="flex justify-center mb-6">
                    <div className="bg-slate-900 p-4 rounded-2xl shadow-lg">
                        <GraduationCap size={48} className="text-brand-500" />
                    </div>
                </div>
                
                <h1 className="text-3xl font-extrabold text-slate-900 mb-1">
                    English<span className="text-brand-500">Buddy</span>
                </h1>
                <p className="text-slate-500 font-medium mb-8">Trợ lý Tiếng Anh cá nhân của em</p>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 mb-6 text-left">
                    <p>👋 <strong>Chào em!</strong> Để bắt đầu học, hãy lấy API Key miễn phí từ Google AI Studio (10 giây) và dán vào đây nhé.</p>
                </div>

                <input 
                    type="password" 
                    placeholder="Dán API Key của bạn vào đây..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition text-slate-800"
                />

                <div className="flex gap-3">
                    {keyInput && (
                        <button 
                            onClick={handleClear}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition"
                        >
                            Xóa Key
                        </button>
                    )}
                    <button 
                        onClick={handleSubmit}
                        className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-200 transition transform hover:scale-[1.02]"
                    >
                        Bắt đầu
                    </button>
                </div>

                <div className="mt-6 text-xs text-slate-400">
                    Lấy key tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline font-semibold">aistudio.google.com</a> (miễn phí!)
                    <div className="mt-1">*Ứng dụng sử dụng công nghệ Google Gemini AI.</div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;