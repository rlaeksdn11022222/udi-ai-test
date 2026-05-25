import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { PinnedProblem } from './PinnedProblem';
import { Sidebar, MobileMenuButton } from './Sidebar';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctFeedback: string;
  missedPoints: string[];
}

const questions: Question[] = [
  {
    id: 1,
    question: "문제를 보고 가장 먼저 무엇을 파악해야 할까요?",
    options: [
      "무슨 유형의 문제인지",
      "바로 계산 시작",
      "그래프 그리기"
    ],
    correctFeedback: "정확해요! x²이 있고 =0이면 이차방정식이라는 걸 먼저 파악해야 해요.",
    missedPoints: [
      "ax² + bx + c = 0의 일반형을 떠올리면 좋아요",
      "유형을 알아야 어떤 공식을 쓸지 정할 수 있어요"
    ]
  },
  {
    id: 2,
    question: "왜 인수분해가 아니라 근의 공식을 선택했나요?",
    options: [
      "근의 공식이 더 멋있어서",
      "인수분해가 쉽게 안 보여서",
      "선생님이 그렇게 하라고 해서"
    ],
    correctFeedback: "맞아요! 인수분해가 바로 안 보이면 근의 공식이 만능 열쇠예요.",
    missedPoints: [
      "인수분해는 깔끔하게 떨어질 때만 쓸 수 있어요",
      "3초 고민해도 안 보이면 근의 공식으로 가야 해요"
    ]
  },
  {
    id: 3,
    question: "판별식 D를 먼저 계산하는 이유는?",
    options: [
      "그냥 단계니까",
      "풀 수 있는지 먼저 확인",
      "계산 연습을 위해"
    ],
    correctFeedback: "완벽해요! D가 음수면 실수 해가 없으니 먼저 확인하는 거죠.",
    missedPoints: [
      "D > 0: 두 실근, D = 0: 중근, D < 0: 허근이에요",
      "D를 보고 '계속 풀지/멈출지' 판단해요"
    ]
  }
];

export function Training() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userMessage } = location.state || { userMessage: '이차방정식 2x² + 5x - 3 = 0을 풀어주세요' };
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [allMissedPoints, setAllMissedPoints] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowFeedback(true);
    if (currentQuestion.missedPoints.length > 0) {
      setAllMissedPoints([...allMissedPoints, ...currentQuestion.missedPoints]);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setIsComplete(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Pinned Problem Area */}
      <div className="sticky top-0 z-30">
        <div className="h-14 bg-white border-b border-gray-200/50 px-4 flex items-center lg:hidden">
          <MobileMenuButton onClick={() => setIsSidebarOpen(true)} />
        </div>
        <PinnedProblem problemText={userMessage} />
      </div>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Chat Area */}
        <main className="flex-1 bg-[#F9F9F8] overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
            {!isComplete && (
              <>
                {/* Progress Indicator */}
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    질문 {currentQuestionIndex + 1} / {questions.length}
                  </p>
                </div>

                {/* AI Intro Message (only first time) */}
                {currentQuestionIndex === 0 && (
                  <div className="w-full">
                    <div className="bg-[#F0F0EE] rounded-2xl px-6 py-5">
                      <p className="text-base text-gray-900">
                        이제 제대로 이해했는지 확인해볼게요! 🎯
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Question */}
                <div className="w-full">
                  <div className="bg-[#F0F0EE] rounded-2xl px-6 py-5">
                    <p className="text-lg font-medium text-gray-900">
                      {currentQuestion.question}
                    </p>
                  </div>
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => !showFeedback && handleAnswer(option)}
                      disabled={showFeedback}
                      className="w-full px-5 py-3.5 border-2 border-[#5C6BC0] text-[#5C6BC0] rounded-full hover:bg-[#5C6BC0] hover:text-white transition-colors text-base font-medium text-left disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {option}
                    </button>
                  ))}
                  <button
                    disabled={showFeedback}
                    className="w-full px-5 py-3.5 border-2 border-[#5C6BC0] text-[#5C6BC0] rounded-full hover:bg-[#5C6BC0] hover:text-white transition-colors text-base font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    직접 입력하기...
                  </button>
                </div>

                {/* Feedback */}
                {showFeedback && (
                  <div className="space-y-4">
                    {/* Correct Feedback */}
                    <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-base text-green-900 leading-relaxed">
                          {currentQuestion.correctFeedback}
                        </p>
                      </div>
                    </div>

                    {/* Missed Points */}
                    {currentQuestion.missedPoints.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-bold text-amber-900 mb-2.5 text-base">
                              이런 부분은 알아두세요!
                            </h4>
                            <ul className="space-y-2">
                              {currentQuestion.missedPoints.map((point, index) => (
                                <li key={index} className="text-sm text-amber-900 leading-relaxed">
                                  • {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Next Button */}
                    <button
                      onClick={handleNext}
                      className="w-full px-6 py-3.5 bg-[#5C6BC0] hover:bg-[#4E5BAD] text-white rounded-full transition-colors font-medium text-base"
                    >
                      {currentQuestionIndex < questions.length - 1 ? '다음 질문으로 →' : '완료하기'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Completion Summary */}
            {isComplete && (
              <div className="space-y-6">
                <div className="w-full">
                  <div className="bg-[#F0F0EE] rounded-2xl px-6 py-5 text-center">
                    <p className="text-xl font-bold text-gray-900 mb-2">
                      훈련 완료! 🎉
                    </p>
                    <p className="text-base text-gray-700">
                      이제 이차방정식은 확실히 이해했어요!
                    </p>
                  </div>
                </div>

                {allMissedPoints.length > 0 && (
                  <div className="bg-indigo-50 border-2 border-[#5C6BC0] rounded-xl px-6 py-5">
                    <h3 className="font-bold text-[#5C6BC0] mb-4 text-lg">
                      📚 꼭 기억하세요
                    </h3>
                    <ul className="space-y-2.5">
                      {[...new Set(allMissedPoints)].map((point, index) => (
                        <li key={index} className="text-sm text-gray-900 leading-relaxed">
                          • {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => navigate('/')}
                  className="w-full px-6 py-3.5 bg-[#5C6BC0] hover:bg-[#4E5BAD] text-white rounded-full transition-colors font-medium text-base"
                >
                  처음으로 돌아가기
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
