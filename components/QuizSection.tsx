import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';
import { MultipleChoice, TrueFalse, FillBlank, DragDrop } from './QuizTypes';
import { ArrowRight, RefreshCcw, CheckCircle, RotateCcw } from 'lucide-react';

interface QuizSectionProps {
  questions: QuizQuestion[];
  onRestart: () => void;
}

const QuizSection: React.FC<QuizSectionProps> = ({ questions: initialQuestions, onRestart }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Reset internal state if parent passes new questions
  useEffect(() => {
    setQuestions(initialQuestions);
    setCurrentIndex(0);
    setShowFeedback(false);
    setIsCompleted(false);
  }, [initialQuestions]);

  const handleAnswer = (answer: string) => {
    const updated = [...questions];
    updated[currentIndex].userAnswer = answer;
    setQuestions(updated);
  };

  const checkCurrent = () => {
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowFeedback(false);
    } else {
      setIsCompleted(true);
    }
  };

  const calculateScore = () => {
    const correct = questions.filter(q => {
        if (!q.userAnswer) return false;
        return q.userAnswer.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim();
    }).length;
    return Math.round((correct / questions.length) * 100);
  };

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + (isCompleted ? 1 : 0)) / questions.length) * 100;

  if (isCompleted) {
    const score = calculateScore();
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center mb-6">
            <CheckCircle size={48} className={score >= 70 ? "text-green-500" : "text-brand-500"} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Completed!</h2>
        <p className="text-slate-500 mb-8">You achieved a score of</p>
        
        <div className="text-6xl font-black text-brand-600 mb-8">{score}%</div>
        
        <div className="flex gap-4">
             <button 
                onClick={onRestart}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border-2 border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
            >
                <RotateCcw size={20} />
                Try Again
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto py-6 px-4">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
        <div 
            className="h-full bg-brand-500 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
        <div className="mb-6">
            <span className="text-sm font-bold text-brand-600 tracking-wider uppercase">Question {currentIndex + 1} of {questions.length}</span>
        </div>

        {currentQ.type === 'multiple_choice' && (
            <MultipleChoice question={currentQ} onAnswer={handleAnswer} showFeedback={showFeedback} />
        )}
        {(currentQ.type === 'true_false' || currentQ.type === 'matching') && (
            <TrueFalse question={currentQ} onAnswer={handleAnswer} showFeedback={showFeedback} />
        )}
         {currentQ.type === 'fill_blank' && (
            <FillBlank question={currentQ} onAnswer={handleAnswer} showFeedback={showFeedback} />
        )}
        {currentQ.type === 'drag_drop' && (
            <DragDrop question={currentQ} onAnswer={handleAnswer} showFeedback={showFeedback} />
        )}

        {showFeedback && currentQ.explanation && (
            <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100">
                <strong>Explanation:</strong> {currentQ.explanation}
            </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 md:absolute md:rounded-b-2xl">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
            {!showFeedback ? (
                <button 
                    onClick={checkCurrent}
                    disabled={!currentQ.userAnswer}
                    className="ml-auto bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Check Answer
                </button>
            ) : (
                 <button 
                    onClick={nextQuestion}
                    className="ml-auto flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-medium transition"
                >
                    {currentIndex === questions.length - 1 ? "Finish" : "Next"} <ArrowRight size={20} />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default QuizSection;