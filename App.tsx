import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Upload, Volume2, Plus, ArrowLeft, Loader2, Library, GraduationCap, X, ChevronRight, Menu, FileText, Type, Image as ImageIcon, Download, LogOut } from 'lucide-react';
import { AppState, LessonContent, Vocabulary, QuizQuestion } from './types';
import { analyzeContent, generateQuiz, getWordDefinition, initGenAI } from './services/geminiService';
import AudioPlayer from './components/AudioPlayer';
import QuizSection from './components/QuizSection';
import WelcomeScreen from './components/WelcomeScreen';

const MOCK_LESSONS: LessonContent[] = [
    {
        id: 'sample-1',
        title: 'The Coffee Culture',
        dateCreated: Date.now(),
        fullText: "Coffee culture is the set of traditions and social behaviors that surround the consumption of coffee, particularly as a social lubricant. The term also refers to the cultural diffusion and adoption of coffee as a widely consumed stimulant. In the late 20th century, espresso became an increasingly dominant phenomenon across much of the western world.",
        summary: "Văn hóa cà phê bao gồm các truyền thống và hành vi xã hội xung quanh việc uống cà phê. Nó đã trở thành một hiện tượng phổ biến ở phương Tây vào cuối thế kỷ 20.",
        vocabulary: [
            { id: 'v1', word: 'Lubricant', ipa: '/ˈluːbrɪkənt/', englishDefinition: 'A substance that minimizes friction', meaning: 'Chất bôi trơn (nghĩa bóng: chất xúc tác xã hội)', type: 'noun' },
            { id: 'v2', word: 'Diffusion', ipa: '/dɪˈfjuːʒn/', englishDefinition: 'The spreading of something more widely', meaning: 'Sự khuếch tán, sự lan truyền', type: 'noun' },
            { id: 'v3', word: 'Stimulant', ipa: '/ˈstɪmjələnt/', englishDefinition: 'A substance that raises levels of physiological or nervous activity', meaning: 'Chất kích thích', type: 'noun' },
            { id: 'v4', word: 'Dominant', ipa: '/ˈdɒmɪnənt/', englishDefinition: 'Most important, powerful, or influential', meaning: 'Chiếm ưu thế', type: 'adj' }
        ]
    }
];

function App() {
  const [hasKey, setHasKey] = useState(false);
  const [state, setState] = useState<AppState>(AppState.HOME);
  const [lessons, setLessons] = useState<LessonContent[]>(MOCK_LESSONS);
  const [currentLesson, setCurrentLesson] = useState<LessonContent | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [inputMethod, setInputMethod] = useState<'upload' | 'text'>('upload');
  const [pastedText, setPastedText] = useState('');

  // Check for API Key on mount
  useEffect(() => {
    const key = localStorage.getItem('ENGLISH_BUDDY_KEY');
    if (key) {
        initGenAI(key);
        setHasKey(true);
    }
  }, []);

  const handleLogin = (key: string) => {
    initGenAI(key);
    setHasKey(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('ENGLISH_BUDDY_KEY');
    setHasKey(false);
    setLessons(MOCK_LESSONS);
    setCurrentLesson(null);
    setState(AppState.HOME);
  };

  // File Upload Handling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | DragEvent) => {
    let file: File | null = null;
    
    // @ts-ignore
    if ('dataTransfer' in e) {
       // @ts-ignore
       file = e.dataTransfer?.files[0] || null;
    } else {
       // @ts-ignore
       file = e.target.files ? e.target.files[0] : null;
    }

    if (!file) return;

    setState(AppState.PROCESSING);

    try {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            try {
                // Analyze using Gemini
                const lesson = await analyzeContent(content, file?.type);
                setLessons(prev => [lesson, ...prev]);
                setCurrentLesson(lesson);
                setState(AppState.LEARNING);
            } catch (err: any) {
                 console.error(err);
                 alert("Lỗi: " + err.message);
                 setState(AppState.HOME);
            }
        };
        reader.readAsDataURL(file);
    } catch (err) {
        console.error(err);
        alert("Không thể đọc file. Vui lòng thử lại.");
        setState(AppState.HOME);
    }
  };

  const handleTextSubmit = async () => {
      if (!pastedText.trim()) {
          alert("Vui lòng nhập văn bản.");
          return;
      }
      
      setState(AppState.PROCESSING);
      try {
          const lesson = await analyzeContent(pastedText);
          setLessons(prev => [lesson, ...prev]);
          setCurrentLesson(lesson);
          setState(AppState.LEARNING);
          setPastedText(''); // Clear buffer
      } catch (err: any) {
          console.error(err);
          alert("Lỗi: " + err.message);
          setState(AppState.HOME);
      }
  };

  const handleDownloadDoc = () => {
      if (!currentLesson) return;
      
      const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${currentLesson.title}</title></head><body>`;
      
      const content = `<h1>${currentLesson.title}</h1>
      <p><strong>Summary:</strong> ${currentLesson.summary}</p>
      <hr/>
      <p>${currentLesson.fullText.replace(/\n/g, '<br/>')}</p>
      <hr/>
      <h3>Vocabulary List</h3>
      <ul>
        ${currentLesson.vocabulary.map(v => `<li><strong>${v.word}</strong> (${v.type}) [${v.ipa}]: ${v.englishDefinition} - ${v.meaning}</li>`).join('')}
      </ul>`;
      
      const footer = "</body></html>";
      
      const sourceHTML = header + content + footer;
      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
      
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = source;
      fileDownload.download = `${currentLesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`;
      fileDownload.click();
      document.body.removeChild(fileDownload);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // @ts-ignore
    handleFileUpload(e.nativeEvent);
  };

  const startQuiz = async () => {
    if (!currentLesson) return;
    setIsGeneratingQuiz(true);
    const qs = await generateQuiz(currentLesson.fullText);
    setQuizQuestions(qs);
    setIsGeneratingQuiz(false);
    if(qs.length > 0) setState(AppState.QUIZ);
    else alert("Nội dung quá ngắn để tạo bài tập.");
  };

  const addWordToVocab = async (word: string) => {
      if (!currentLesson) return;
      
      // Check duplicates
      const exists = currentLesson.vocabulary.find(v => v.word.toLowerCase() === word.toLowerCase());
      if(exists) return;

      // Optimistic update
      const tempId = Date.now().toString();
      const newVocab: Vocabulary = { id: tempId, word: word, ipa: '...', englishDefinition: 'Loading...', meaning: 'Đang tải...', type: '...' };
      
      const updatedLesson = { ...currentLesson, vocabulary: [newVocab, ...currentLesson.vocabulary] };
      setCurrentLesson(updatedLesson);

      // Fetch real definition
      const def = await getWordDefinition(word, currentLesson.fullText);
      
      setCurrentLesson(prev => {
          if(!prev) return null;
          const newList = prev.vocabulary.map(v => v.id === tempId ? def : v);
          return { ...prev, vocabulary: newList };
      });
  };

  const playWordAudio = (word: string) => {
      if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(word);
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
      } else {
          console.warn("Speech synthesis not supported");
      }
  };

  const TextRenderer = ({ text }: { text: string }) => {
    const lines = text.split('\n');
    
    return (
        <div className="space-y-4 text-lg md:text-xl leading-loose text-slate-700 font-serif">
            {lines.map((line, lineIdx) => (
                <p key={lineIdx}>
                    {line.split(/(\s+)/).map((seg, i) => {
                        const cleanWord = seg.trim().replace(/[.,!?;:()"']/g, "");
                        if (!cleanWord) return <span key={i}>{seg}</span>;
                        
                        return (
                            <span 
                                key={i} 
                                onClick={() => addWordToVocab(cleanWord)}
                                className="cursor-pointer hover:bg-brand-100 hover:text-brand-700 transition-colors rounded px-0.5"
                            >
                                {seg}
                            </span>
                        )
                    })}
                </p>
            ))}
        </div>
    )
  };

  if (!hasKey) {
      return <WelcomeScreen onStart={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 z-10">
        <div className="p-6 flex items-center gap-2 text-brand-600">
            <GraduationCap size={32} />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">EnglishBuddy</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
            <button 
                onClick={() => setState(AppState.HOME)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${state === AppState.HOME ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <Library size={20} /> Thư viện
            </button>
             <button 
                onClick={() => { setState(AppState.HOME); setCurrentLesson(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-slate-600 hover:bg-slate-50`}
            >
                <Plus size={20} /> Bài học mới
            </button>
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-4">
             {currentLesson && state !== AppState.HOME && (
                <div className="mb-2">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Đang học</div>
                    <div className="text-sm font-medium text-slate-800 line-clamp-2">{currentLesson.title}</div>
                </div>
             )}
             
             <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                <LogOut size={16} /> Đổi API Key
             </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
             <div className="flex items-center gap-2 text-brand-600">
                <GraduationCap size={24} />
                <span className="font-bold text-slate-900">EnglishBuddy</span>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
                <Menu size={24} />
            </button>
        </header>

         {/* Mobile Menu Overlay */}
         {mobileMenuOpen && (
            <div className="absolute inset-0 z-50 bg-white p-4 animate-fade-in md:hidden">
                <div className="flex justify-end mb-8">
                    <button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button>
                </div>
                 <button 
                    onClick={() => { setState(AppState.HOME); setMobileMenuOpen(false); }}
                    className="w-full text-left text-lg font-medium py-4 border-b border-slate-100"
                >
                    Thư viện bài học
                </button>
                 <button 
                    onClick={() => { setState(AppState.HOME); setCurrentLesson(null); setMobileMenuOpen(false); }}
                    className="w-full text-left text-lg font-medium py-4 border-b border-slate-100"
                >
                    Tạo bài mới
                </button>
                <button 
                    onClick={handleLogout}
                    className="w-full text-left text-lg font-medium py-4 border-b border-slate-100 text-red-600"
                >
                    Đăng xuất (Đổi Key)
                </button>
            </div>
         )}

        {/* --- VIEW: HOME / LIBRARY --- */}
        {state === AppState.HOME && (
             <div className="flex-1 overflow-y-auto p-6 md:p-12">
                <div className="max-w-4xl mx-auto space-y-12">
                    
                    {/* Upload Section */}
                    <section>
                         <h2 className="text-2xl font-bold text-slate-800 mb-6">Bắt đầu học</h2>
                         
                         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex border-b border-slate-100">
                                <button 
                                    onClick={() => setInputMethod('upload')}
                                    className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 transition ${inputMethod === 'upload' ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-500' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    <FileText size={18} /> Tải file
                                </button>
                                <button 
                                    onClick={() => setInputMethod('text')}
                                    className={`flex-1 py-4 font-medium text-sm flex items-center justify-center gap-2 transition ${inputMethod === 'text' ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-500' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    <Type size={18} /> Nhập văn bản
                                </button>
                            </div>

                            <div className="p-8">
                                {inputMethod === 'upload' ? (
                                    <div 
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${dragActive ? 'border-brand-500 bg-brand-50 scale-[1.01]' : 'border-slate-300 hover:border-brand-400 bg-slate-50'}`}
                                    >
                                        <div className="w-16 h-16 bg-white border border-slate-200 text-brand-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <Upload size={32} />
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-900 mb-1">Kéo thả file vào đây</h3>
                                        <p className="text-sm text-slate-500 mb-6">Hỗ trợ PDF, Ảnh (JPG, PNG) hoặc File chữ (.txt)</p>
                                        
                                        <label className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-medium cursor-pointer transition shadow-lg shadow-brand-200">
                                            Chọn file từ máy
                                            <input type="file" className="hidden" accept="image/*,application/pdf,.txt" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <textarea
                                            value={pastedText}
                                            onChange={(e) => setPastedText(e.target.value)}
                                            placeholder="Dán nội dung tiếng Anh cần học vào đây..."
                                            className="w-full h-48 p-4 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none bg-slate-50"
                                        />
                                        <div className="flex justify-end">
                                             <button 
                                                onClick={handleTextSubmit}
                                                disabled={!pastedText.trim()}
                                                className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-200"
                                            >
                                                Bắt đầu học ngay
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                         </div>
                    </section>

                    {/* Recent Lessons */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-6">Bài học gần đây</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {lessons.map(lesson => (
                                <button 
                                    key={lesson.id}
                                    onClick={() => { setCurrentLesson(lesson); setState(AppState.LEARNING); }}
                                    className="text-left p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-200 transition group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-slate-800 text-lg group-hover:text-brand-600 transition">{lesson.title}</h3>
                                        <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-500" />
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2">{lesson.summary}</p>
                                    <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-400">
                                        <span className="bg-slate-100 px-2 py-1 rounded">{lesson.vocabulary.length} từ vựng</span>
                                        <span>{new Date(lesson.dateCreated).toLocaleDateString()}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
             </div>
        )}

        {/* --- VIEW: PROCESSING --- */}
        {state === AppState.PROCESSING && (
            <div className="flex-1 flex flex-col items-center justify-center bg-white">
                <div className="relative">
                     <div className="w-16 h-16 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen size={24} className="text-brand-500" />
                     </div>
                </div>
                <h2 className="mt-6 text-xl font-bold text-slate-800">Đang tạo bài học...</h2>
                <p className="text-slate-500 mt-2">Hệ thống đang phân tích văn bản, trích xuất từ vựng và tạo audio.</p>
            </div>
        )}

        {/* --- VIEW: LEARNING / QUIZ --- */}
        {(state === AppState.LEARNING || state === AppState.QUIZ) && currentLesson && (
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Lesson Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setState(AppState.HOME)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="font-bold text-slate-800 text-lg">{currentLesson.title}</h2>
                            <p className="text-xs text-slate-500 hidden md:block">{state === AppState.QUIZ ? "Chế độ Bài tập" : "Chế độ Học"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                         {state === AppState.LEARNING && (
                             <>
                                <button 
                                    onClick={handleDownloadDoc}
                                    className="flex items-center gap-2 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg font-medium transition text-sm hidden sm:flex"
                                    title="Tải về file Word"
                                >
                                    <Download size={18} />
                                    Word
                                </button>
                                <button 
                                    onClick={startQuiz}
                                    disabled={isGeneratingQuiz}
                                    className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium transition text-sm disabled:opacity-50"
                                >
                                    {isGeneratingQuiz ? <Loader2 size={18} className="animate-spin" /> : <BookOpen size={18} />}
                                    Làm bài tập
                                </button>
                             </>
                        )}
                         {state === AppState.QUIZ && (
                             <button 
                                onClick={() => setState(AppState.LEARNING)}
                                className="flex items-center gap-2 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg font-medium transition text-sm"
                             >
                                <ArrowLeft size={18} /> Quay lại bài học
                             </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                    
                    {state === AppState.QUIZ ? (
                        <div className="w-full h-full bg-slate-50">
                            <QuizSection questions={quizQuestions} onRestart={startQuiz} />
                        </div>
                    ) : (
                        <>
                            {/* Left: Text Content */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-white">
                                <div className="max-w-2xl mx-auto pb-20">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="bg-orange-50 text-orange-700 text-sm font-medium px-3 py-1 rounded-full border border-orange-100">Reading</div>
                                        <AudioPlayer text={currentLesson.fullText} />
                                    </div>
                                    
                                    {currentLesson.imageUrl && (
                                        <div className="mb-8 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                                            <div className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                                Ảnh gốc
                                            </div>
                                            <img src={currentLesson.imageUrl} alt="Lesson Source" className="w-full h-auto" />
                                        </div>
                                    )}
                                    
                                    {currentLesson.imageUrl && (
                                         <div className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                                            Văn bản trích xuất
                                        </div>
                                    )}

                                    <TextRenderer text={currentLesson.fullText} />

                                    <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-100">
                                        <h3 className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wide">Tóm tắt</h3>
                                        <p className="text-slate-600 italic">{currentLesson.summary}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Vocabulary Sidebar */}
                            <div className="w-full md:w-80 lg:w-96 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col h-1/3 md:h-full shrink-0 shadow-xl md:shadow-none z-20">
                                <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                                    <h3 className="font-bold text-slate-800">Từ vựng</h3>
                                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">{currentLesson.vocabulary.length} từ</span>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                                    {currentLesson.vocabulary.length === 0 ? (
                                        <div className="text-center text-slate-400 mt-10 p-4">
                                            <p>Chưa có từ vựng nào.</p>
                                            <p className="text-xs mt-2">Bấm vào bất kỳ từ nào trong bài đọc để tra cứu.</p>
                                        </div>
                                    ) : (
                                        currentLesson.vocabulary.map((vocab) => (
                                            <div key={vocab.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-brand-200 transition">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-brand-700 text-lg">{vocab.word}</span>
                                                    <span className="text-xs font-mono text-slate-400 bg-slate-50 px-1 rounded">{vocab.type}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-slate-500 text-sm font-mono">{vocab.ipa}</span>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            playWordAudio(vocab.word);
                                                        }}
                                                        className="p-1 rounded-full bg-slate-100 hover:bg-brand-100 text-slate-500 hover:text-brand-600 transition"
                                                    >
                                                        <Volume2 size={12} />
                                                    </button>
                                                </div>
                                                <p className="text-slate-600 text-sm italic mb-1">{vocab.englishDefinition}</p>
                                                <p className="text-slate-800 text-sm font-medium border-t border-slate-100 pt-1">{vocab.meaning}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

export default App;