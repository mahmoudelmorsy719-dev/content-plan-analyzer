import React, { useState, useRef, useEffect } from 'react';
import { QUESTIONS, getResult } from './constants';
import QuestionCard from './components/QuestionCard';
import ResultCard from './components/ResultCard';
import { QuizState } from './types';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    isFinished: false,
  });

  // To support smooth transitions, we key the question component
  const currentQuestion = QUESTIONS[quizState.currentQuestionIndex];
  const progress = ((quizState.currentQuestionIndex + 1) / QUESTIONS.length) * 100;
  
  const handleSelectOption = (optionId: string) => {
    // Save answer
    setQuizState(prev => ({
      ...prev,
      answers: { ...prev.answers, [currentQuestion.id]: optionId }
    }));

    // Small delay before auto-advance for better UX
    setTimeout(() => {
      handleNext();
    }, 400);
  };

  const handleNext = () => {
    setQuizState(prev => {
      const isLast = prev.currentQuestionIndex === QUESTIONS.length - 1;
      if (isLast) {
        return { ...prev, isFinished: true };
      }
      return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 };
    });
  };

  const handleBack = () => {
    setQuizState(prev => {
      if (prev.currentQuestionIndex === 0) return prev;
      return { ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 };
    });
  };

  const resetQuiz = () => {
    setQuizState({
      currentQuestionIndex: 0,
      answers: {},
      isFinished: false,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden bg-slate-50">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-4xl relative z-10">
        
        {/* Header */}
        {!quizState.isFinished && (
          <header className="mb-12 text-center slide-up">
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-900 mb-2 opacity-90">
               تحليل خطة المحتوى الشاملة
            </h1>
            
            {/* Progress Bar */}
            <div className="w-full max-w-xs mx-auto mt-6">
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                <span>البداية</span>
                <span>{Math.round(progress)}%</span>
                <span>النهاية</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="mt-2 text-center text-sm font-medium text-slate-500">
                سؤال {quizState.currentQuestionIndex + 1} من {QUESTIONS.length}
              </div>
            </div>
          </header>
        )}

        {/* Content Area */}
        <main className="min-h-[400px] flex items-center justify-center">
          {!quizState.isFinished ? (
            <div className="w-full">
              <QuestionCard 
                key={currentQuestion.id} // Forces re-render animation on change
                question={currentQuestion}
                selectedOptionId={quizState.answers[currentQuestion.id]}
                onSelect={handleSelectOption}
              />
              
              {/* Navigation Controls */}
              <div className="flex justify-between mt-12 max-w-2xl mx-auto px-2">
                <button
                  onClick={handleBack}
                  disabled={quizState.currentQuestionIndex === 0}
                  className={`flex items-center text-slate-400 hover:text-indigo-600 transition-colors ${quizState.currentQuestionIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                  <ChevronRight size={20} />
                  <span className="mr-1">السابق</span>
                </button>
              </div>
            </div>
          ) : (
            <ResultCard 
              result={getResult(quizState.answers)}
              questions={QUESTIONS}
              answers={quizState.answers}
              onReset={resetQuiz}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;