import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, CheckCircle, X } from 'lucide-react';
import { useCategory } from '../contexts/CategoryContext';
import { Sidebar, MobileMenuButton } from './Sidebar';
import { BlockMath } from 'react-katex';

type PracticeMode = 'descriptive' | 'multiple-choice' | null;

interface PracticeQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

// Mock practice questions
const mockQuestions: Record<string, PracticeQuestion[]> = {
  'quadratic-formula': [
    {
      id: '1',
      question: '방정식 3x² - 7x + 2 = 0의 해를 구하세요.',
      options: ['x = 1/3, x = 2', 'x = 2, x = 1/3', 'x = 1, x = 2/3'],
      correctAnswer: 'x = 2, x = 1/3',
      explanation: '근의 공식을 사용하여 풀면 됩니다...'
    }
  ]
};

export function CategoryPractice() {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const { getCategoryMastery, updateMastery } = useCategory();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const category = getCategoryMastery(categoryId || '');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!category) {
    return <div>Category not found</div>;
  }

  const handleModeSelect = (mode: PracticeMode) => {
    setPracticeMode(mode);
  };

  const handleQuestionCountSelect = (count: number) => {
    setQuestionCount(count);
  };

  const handleSubmitAnswer = () => {
    const questions = mockQuestions[categoryId || ''] || [];
    const currentQuestion = questions[currentQuestionIndex];
    const correct = userAnswer.trim() === currentQuestion.correctAnswer;

    setIsCorrect(correct);
    setShowExplanation(true);
    updateMastery(categoryId || '', correct);
  };

  const handleNext = () => {
    setUserAnswer('');
    setShowExplanation(false);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  // Mode Selection Screen
  if (!practiceMode || !questionCount) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9F9F8]">
        <header className="h-14 bg-white border-b border-gray-200/50 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <MobileMenuButton onClick={() => setIsSidebarOpen(true)} />
            <button
              onClick={() => navigate('/category-dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">{category.subcategory}</h1>
          </div>
        </header>

        <div className="flex flex-1">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
            <div className="max-w-2xl mx-auto space-y-8">
              {/* Category Info */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {category.subcategory} 연습
                </h2>
                <p className="text-base text-gray-600">
                  현재 이해도: <span className="font-bold text-[#5C6BC0]">{category.masteryPercentage}%</span>
                </p>
              </div>

              {/* Mode Selection */}
              {!practiceMode && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">학습 방식을 선택하세요</h3>
                  <div className="grid gap-3">
                    <button
                      onClick={() => handleModeSelect('descriptive')}
                      className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#5C6BC0] transition-colors text-left"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">서술형 모드</h4>
                      <p className="text-sm text-gray-600">
                        문제를 읽고 직접 풀이과정을 작성하며 학습합니다
                      </p>
                    </button>

                    <button
                      onClick={() => handleModeSelect('multiple-choice')}
                      className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#5C6BC0] transition-colors text-left"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">객관식 모드</h4>
                      <p className="text-sm text-gray-600">
                        보기 중에서 정답을 선택하며 빠르게 학습합니다
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Question Count Selection */}
              {practiceMode && !questionCount && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">문제 수를 선택하세요</h3>
                  <p className="text-sm text-gray-600">
                    💡 문제 수가 많을수록 결과가 더 정확해집니다.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[3, 5, 10].map(count => (
                      <button
                        key={count}
                        onClick={() => handleQuestionCountSelect(count)}
                        className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#5C6BC0] transition-colors"
                      >
                        <div className="text-3xl font-bold text-[#5C6BC0] mb-1">{count}</div>
                        <div className="text-sm text-gray-600">문제</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Practice Screen
  const questions = mockQuestions[categoryId || ''] || [];
  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9F9F8]">
        <header className="h-14 bg-white border-b border-gray-200/50 px-4 sm:px-8 flex items-center sticky top-0 z-30">
          <button
            onClick={() => navigate('/category-dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
            <span className="text-base font-medium">돌아가기</span>
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">연습 완료!</h2>
            <p className="text-base text-gray-600 mb-6">
              {category.subcategory} 연습을 완료했습니다.
            </p>
            <button
              onClick={() => navigate('/category-dashboard')}
              className="px-6 py-3 bg-[#5C6BC0] hover:bg-[#4E5BAD] text-white rounded-full font-medium transition-colors"
            >
              유형 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F8]">
      <header className="h-14 bg-white border-b border-gray-200/50 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <MobileMenuButton onClick={() => setIsSidebarOpen(true)} />
          <button
            onClick={() => navigate('/category-dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <span className="text-sm text-gray-600">
            {currentQuestionIndex + 1} / {questionCount}
          </span>
        </div>
      </header>

      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Question */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-lg font-medium text-gray-900 leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            {/* Answer Input */}
            {!showExplanation && (
              <div className="space-y-4">
                {practiceMode === 'multiple-choice' && currentQuestion.options ? (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setUserAnswer(option)}
                        className={`w-full px-6 py-4 text-left rounded-xl border-2 transition-colors ${
                          userAnswer === option
                            ? 'border-[#5C6BC0] bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="답을 입력하세요..."
                    className="w-full h-32 px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-[#5C6BC0] focus:outline-none resize-none"
                  />
                )}

                <button
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim()}
                  className="w-full px-6 py-3.5 bg-[#5C6BC0] hover:bg-[#4E5BAD] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full font-medium transition-colors"
                >
                  제출하기
                </button>
              </div>
            )}

            {/* Explanation (matches existing analysis screen style) */}
            {showExplanation && (
              <div className="space-y-6">
                {/* Correct/Incorrect Indicator */}
                <div className={`rounded-xl p-5 border-2 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <X className="w-6 h-6 text-red-600" />
                    )}
                    <p className={`font-bold text-lg ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                      {isCorrect ? '정답입니다!' : '틀렸습니다'}
                    </p>
                  </div>
                  {!isCorrect && (
                    <p className="mt-2 text-sm text-red-800">
                      정답: {currentQuestion.correctAnswer}
                    </p>
                  )}
                </div>

                {/* Detailed Explanation (same style as Response screen) */}
                <div className="bg-[#F0F0EE] rounded-2xl px-6 py-6 space-y-4">
                  <h3 className="text-xl font-bold text-[#5C6BC0] flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    풀이 설명
                  </h3>
                  <p className="text-base text-gray-900 leading-relaxed whitespace-pre-line">
                    {currentQuestion.explanation}
                  </p>
                </div>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  className="w-full px-6 py-3.5 bg-[#5C6BC0] hover:bg-[#4E5BAD] text-white rounded-full font-medium transition-colors"
                >
                  다음 문제로 →
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
