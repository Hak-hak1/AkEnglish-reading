import React from 'react';
import { QuizQuestion } from '../types';
import { Check, X } from 'lucide-react';

interface QuestionProps {
  question: QuizQuestion;
  onAnswer: (answer: string) => void;
  showFeedback: boolean;
}

export const MultipleChoice: React.FC<QuestionProps> = ({ question, onAnswer, showFeedback }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-slate-800">{question.question}</h3>
      <div className="grid grid-cols-1 gap-2">
        {question.options?.map((opt, idx) => {
          const isSelected = question.userAnswer === opt;
          const isCorrect = question.correctAnswer === opt;
          
          let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all ";
          
          if (showFeedback) {
            if (isCorrect) btnClass += "border-green-500 bg-green-50 text-green-700";
            else if (isSelected && !isCorrect) btnClass += "border-red-500 bg-red-50 text-red-700";
            else btnClass += "border-slate-100 opacity-50";
          } else {
            if (isSelected) btnClass += "border-brand-500 bg-brand-50 text-brand-700 font-medium";
            else btnClass += "border-slate-100 hover:border-brand-200 hover:bg-slate-50";
          }

          return (
            <button key={idx} onClick={() => !showFeedback && onAnswer(opt)} className={btnClass} disabled={showFeedback}>
              <div className="flex justify-between items-center">
                <span>{opt}</span>
                {showFeedback && isCorrect && <Check size={20} className="text-green-600" />}
                {showFeedback && isSelected && !isCorrect && <X size={20} className="text-red-600" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const TrueFalse: React.FC<QuestionProps> = ({ question, onAnswer, showFeedback }) => {
  const options = ["True", "False", "Doesn't Say"];
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-slate-800">{question.question}</h3>
      <div className="flex gap-3">
        {options.map((opt) => {
          const isSelected = question.userAnswer === opt;
          const isCorrect = question.correctAnswer === opt;
          
          let btnClass = "flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all text-center ";
          
           if (showFeedback) {
            if (isCorrect) btnClass += "border-green-500 bg-green-50 text-green-700";
            else if (isSelected && !isCorrect) btnClass += "border-red-500 bg-red-50 text-red-700";
            else btnClass += "border-slate-100 opacity-50";
          } else {
            if (isSelected) btnClass += "border-brand-500 bg-brand-50 text-brand-700";
            else btnClass += "border-slate-100 hover:border-brand-200 hover:bg-slate-50";
          }

          return (
            <button key={opt} onClick={() => !showFeedback && onAnswer(opt)} className={btnClass} disabled={showFeedback}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const FillBlank: React.FC<QuestionProps> = ({ question, onAnswer, showFeedback }) => {
  const isCorrect = question.userAnswer?.trim().toLowerCase() === (question.correctAnswer as string).toLowerCase();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-800">Fill in the blank:</h3>
      <p className="text-lg leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
        {question.question.replace("_______", "___")}
      </p>
      
      <div className="relative">
        <input
          type="text"
          value={question.userAnswer || ''}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={showFeedback}
          placeholder="Type your answer..."
          className={`w-full p-4 rounded-xl border-2 outline-none transition-colors ${
            showFeedback 
              ? isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
              : "border-slate-200 focus:border-brand-500"
          }`}
        />
        {showFeedback && (
          <div className={`mt-2 text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
            {isCorrect ? "Correct!" : `Incorrect. Answer: ${question.correctAnswer}`}
          </div>
        )}
      </div>
    </div>
  );
};

export const DragDrop: React.FC<QuestionProps> = ({ question, onAnswer, showFeedback }) => {
  const [selectedOption, setSelectedOption] = React.useState<string | null>(question.userAnswer || null);

  const handleSelect = (opt: string) => {
      if (showFeedback) return;
      setSelectedOption(opt);
      onAnswer(opt);
  };

  const parts = question.question.split('_______');

  return (
    <div className="space-y-6">
       <h3 className="text-lg font-medium text-slate-800">Drag & Drop (Select the word to fill in):</h3>
       
       <div className="p-6 bg-slate-50 rounded-xl border-2 border-slate-200 text-xl leading-relaxed font-serif">
          {parts[0]}
          <span className={`inline-block min-w-[100px] border-b-2 px-2 text-center font-bold transition-colors mx-1 ${
              selectedOption 
                ? showFeedback 
                    ? selectedOption === question.correctAnswer ? "text-green-600 border-green-500" : "text-red-600 border-red-500"
                    : "text-brand-600 border-brand-500" 
                : "border-slate-400 text-slate-300"
          }`}>
            {selectedOption || "?"}
          </span>
          {parts.length > 1 ? parts[1] : ''}
       </div>

       <div className="flex flex-wrap gap-3">
          {question.options?.map((opt, idx) => (
             <button
                key={idx}
                onClick={() => handleSelect(opt)}
                disabled={showFeedback}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    selectedOption === opt 
                        ? "bg-brand-100 border-brand-500 text-brand-700 shadow-md transform scale-105"
                        : "bg-white border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-slate-50"
                } ${showFeedback ? "opacity-50 cursor-not-allowed" : ""}`}
             >
                {opt}
             </button>
          ))}
       </div>
        {showFeedback && selectedOption !== question.correctAnswer && (
          <div className="text-red-600 font-medium">Correct answer: {question.correctAnswer}</div>
        )}
    </div>
  );
};