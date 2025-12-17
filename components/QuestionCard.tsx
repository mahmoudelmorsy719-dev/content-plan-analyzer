import React from 'react';
import { Question } from '../types';
import { CheckCircle2, Circle } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, selectedOptionId, onSelect }) => {
  // Check if this is a 1-5 numeric scale (short text) to change layout
  const isNumericScale = question.options.length === 5 && question.options.every(o => o.text.length <= 2);

  return (
    <div className="w-full max-w-2xl mx-auto slide-up">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 leading-relaxed text-center md:text-right">
        {question.text}
      </h2>
      
      {/* Example Section */}
      {question.example && (
        <div className="mb-8 p-4 bg-indigo-50 border-r-4 border-indigo-400 rounded-lg text-slate-700 text-sm md:text-base leading-relaxed text-right shadow-sm">
          <p className="font-bold text-indigo-900 mb-1 block">مثال توضيحي:</p>
          <p>{question.example}</p>
        </div>
      )}
      
      <div className={isNumericScale ? "grid grid-cols-5 gap-2 md:gap-4" : "space-y-4"}>
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          
          if (isNumericScale) {
            return (
              <button
                key={option.id}
                onClick={() => onSelect(option.id)}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300
                  ${isSelected 
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg scale-105' 
                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-slate-50'
                  }
                `}
              >
                <span className="text-2xl md:text-3xl font-bold font-sans">{option.text}</span>
              </button>
            );
          }

          // Default list layout
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`w-full text-right p-5 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 group
                ${isSelected 
                  ? 'border-indigo-600 bg-indigo-50 shadow-md' 
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                }
              `}
            >
              <div className={`flex-shrink-0 transition-colors duration-300 ${isSelected ? 'text-indigo-600' : 'text-slate-300 group-hover:text-indigo-400'}`}>
                {isSelected ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </div>
              <span className={`text-lg font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                {option.text}
              </span>
            </button>
          );
        })}
      </div>
      
      {isNumericScale && (
        <div className="flex justify-between px-2 mt-3 text-sm text-slate-400 font-medium">
          <span>1 (ضعيف)</span>
          <span>5 (ممتاز)</span>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;