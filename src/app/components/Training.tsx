import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { PinnedProblem } from './PinnedProblem';
import { Sidebar, MobileMenuButton } from './Sidebar';

interface TrainingQuestion {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  correctFeedback: string;
  incorrectFeedback: string;
  missedPoints: string[];
  directAnswerKeywords: string[];
}

interface TrainingSet {
  intro: string;
  questions: TrainingQuestion[];
}

const TOTAL_QUESTIONS = 3;

const fallbackTrainingSet: TrainingSet = {
  intro: '해설의 핵심을 제대로 이해했는지 확인해볼게요.',
  questions: [
    {
      id: 1,
      question: '문제를 풀기 전에 가장 먼저 확인해야 할 것은 무엇인가요?',
      options: ['문제의 유형과 조건', '계산을 바로 시작하기', '답 모양을 먼저 추측하기'],
      correctOptionIndex: 0,
      correctFeedback: '맞아요. 유형과 조건을 먼저 잡아야 어떤 방법을 쓸지 정할 수 있어요.',
      incorrectFeedback: '계산보다 먼저 문제의 유형과 조건을 확인해야 해요.',
      missedPoints: ['문제 유형 확인', '주어진 조건 정리', '풀이 방법 선택 이유'],
      directAnswerKeywords: ['유형', '조건', '파악'],
    },
    {
      id: 2,
      question: '해설에서 선택한 풀이 방법을 써야 하는 가장 큰 이유는 무엇인가요?',
      options: ['그 방법이 문제 조건에 가장 잘 맞아서', '항상 제일 짧아서', '외우기 쉬워서'],
      correctOptionIndex: 0,
      correctFeedback: '좋아요. 풀이 방법은 외우는 게 아니라 조건에 맞춰 고르는 거예요.',
      incorrectFeedback: '풀이 방법은 문제 조건과 연결해서 선택해야 해요.',
      missedPoints: ['방법 선택 이유', '조건과 공식 연결', '무작정 공식 대입 피하기'],
      directAnswerKeywords: ['조건', '맞', '방법'],
    },
    {
      id: 3,
      question: '비슷한 문제를 다시 만나면 어떤 순서로 접근하는 게 좋을까요?',
      options: ['유형 확인 → 방법 선택 → 계산 검토', '답부터 보기 → 공식 외우기', '계산만 빠르게 반복하기'],
      correctOptionIndex: 0,
      correctFeedback: '정확해요. 순서를 기억하면 처음 보는 문제도 덜 흔들려요.',
      incorrectFeedback: '비슷한 문제는 접근 순서를 먼저 잡는 연습이 중요해요.',
      missedPoints: ['풀이 순서', '검토 습관', '암기보다 이유 이해'],
      directAnswerKeywords: ['유형', '방법', '계산'],
    },
  ],
};

function stripJsonFence(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, '').replace(/[^\p{L}\p{N}]/gu, '');
}

function isValidTrainingSet(value: unknown): value is TrainingSet {
  const data = value as TrainingSet;
  return Boolean(
    data &&
      Array.isArray(data.questions) &&
      data.questions.length > 0 &&
      data.questions.every(question =>
        typeof question.question === 'string' &&
        Array.isArray(question.options) &&
        question.options.length === 3 &&
        Number.isInteger(question.correctOptionIndex) &&
        question.correctOptionIndex >= 0 &&
        question.correctOptionIndex < question.options.length &&
        typeof question.correctFeedback === 'string' &&
        typeof question.incorrectFeedback === 'string' &&
        Array.isArray(question.missedPoints) &&
        Array.isArray(question.directAnswerKeywords),
      ),
  );
}

async function generateTrainingSet(problem: string, explanation: string, schoolLevel?: string): Promise<TrainingSet> {
  if (!explanation.trim()) return fallbackTrainingSet;

  const prompt = `
너는 사용자가 해설을 제대로 이해했는지 평가하고 지도하는 개인 코치야.

입력으로 다음이 주어진다:
- 문제
- 해설
- 총 문제 수

[입력]
문제: ${problem}
해설: ${explanation}
학생 수준: ${schoolLevel || '중3'}
총 문제 수: ${TOTAL_QUESTIONS}

[문제 생성 방식]
1. 원문 문제를 다시 풀게 하지 말고, 해설의 이해 여부를 확인하는 훈련 문제를 만든다.
2. 각 문제는 "왜 이 방법을 고르는지", "먼저 봐야 할 조건", "실수하기 쉬운 지점", "다음 문제 접근 순서" 중 하나를 평가한다.
3. 객관식 선택지는 3개이며, 오답은 학생이 실제로 헷갈릴 만한 선택지로 만든다.
4. 직접 입력 채점용 핵심 키워드도 2~4개 제공한다.
5. 말투는 친근하지만 짧고 명확하게 쓴다.

[채점 방식]
- correctOptionIndex와 일치하면 정답
- 직접 입력은 directAnswerKeywords 중 핵심 키워드가 충분히 포함되면 정답
- 오답이면 missedPoints로 놓친 개념을 알려준다

반드시 아래 JSON 형식만 출력해. 마크다운, 설명문, 코드블록 금지.
{
  "intro": "짧은 시작 멘트",
  "questions": [
    {
      "id": 1,
      "question": "질문",
      "options": ["선택지1", "선택지2", "선택지3"],
      "correctOptionIndex": 0,
      "correctFeedback": "정답 피드백",
      "incorrectFeedback": "오답 피드백",
      "missedPoints": ["놓친 개념1", "놓친 개념2"],
      "directAnswerKeywords": ["키워드1", "키워드2"]
    }
  ]
}
`;

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
      thinkingConfig: { thinkingLevel: 'minimal' },
      responseMimeType: 'application/json',
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Training generation failed.');

  const parsed = JSON.parse(stripJsonFence(data.text ?? ''));
  if (!isValidTrainingSet(parsed)) return fallbackTrainingSet;

  return {
    intro: parsed.intro || fallbackTrainingSet.intro,
    questions: parsed.questions.slice(0, TOTAL_QUESTIONS).map((question, index) => ({
      ...question,
      id: index + 1,
      missedPoints: question.missedPoints.slice(0, 4),
      directAnswerKeywords: question.directAnswerKeywords.slice(0, 4),
    })),
  };
}

export function Training() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    userMessage,
    problemText,
    explanationText,
    problemImage,
    solutionImage,
    schoolLevel,
  } = location.state || {};

  const displayProblem = problemText || userMessage || '수학 문제';
  const explanation = explanationText || '';

  const [trainingSet, setTrainingSet] = useState<TrainingSet | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationError, setGenerationError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [directAnswer, setDirectAnswer] = useState('');
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [allMissedPoints, setAllMissedPoints] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTrainingSet() {
      setIsGenerating(true);
      setGenerationError('');

      try {
        const generated = await generateTrainingSet(displayProblem, explanation, schoolLevel);
        if (isMounted) setTrainingSet(generated);
      } catch (error) {
        console.error('Training generation error:', error);
        if (isMounted) {
          setGenerationError('훈련 문제를 만드는 중 문제가 생겨 기본 훈련 문제로 시작합니다.');
          setTrainingSet(fallbackTrainingSet);
        }
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    }

    loadTrainingSet();
    return () => {
      isMounted = false;
    };
  }, [displayProblem, explanation, schoolLevel]);

  const questions = trainingSet?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex];
  const uniqueMissedPoints = useMemo(() => [...new Set(allMissedPoints)], [allMissedPoints]);

  const recordAnswer = (isCorrect: boolean, selectedIndex: number | null = null) => {
    if (!currentQuestion) return;

    setSelectedAnswerIndex(selectedIndex);
    setLastAnswerCorrect(isCorrect);
    setShowFeedback(true);

    if (isCorrect) {
      setCorrectCount(count => count + 1);
    } else {
      setAllMissedPoints(prev => [...prev, ...currentQuestion.missedPoints]);
    }
  };

  const handleOptionAnswer = (optionIndex: number) => {
    if (showFeedback || !currentQuestion) return;
    recordAnswer(optionIndex === currentQuestion.correctOptionIndex, optionIndex);
  };

  const handleDirectSubmit = () => {
    if (!directAnswer.trim() || showFeedback || !currentQuestion) return;

    const normalizedAnswer = normalize(directAnswer);
    const keywordHits = currentQuestion.directAnswerKeywords.filter(keyword =>
      normalizedAnswer.includes(normalize(keyword)),
    ).length;
    const correctOptionText = normalize(currentQuestion.options[currentQuestion.correctOptionIndex]);
    const isCorrect = keywordHits >= Math.min(2, currentQuestion.directAnswerKeywords.length) ||
      normalizedAnswer.includes(correctOptionText);

    recordAnswer(isCorrect);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(index => index + 1);
      setSelectedAnswerIndex(null);
      setDirectAnswer('');
      setShowDirectInput(false);
      setShowFeedback(false);
      setLastAnswerCorrect(false);
    } else {
      setIsComplete(true);
    }
  };

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
      <div className="sticky top-0 z-30 w-full max-w-full">
        <div className="flex h-14 items-center border-b border-gray-200/50 bg-white px-4">
          <MobileMenuButton onClick={() => setIsSidebarOpen(true)} />
        </div>
        <PinnedProblem
          problemText={displayProblem}
          problemImage={problemImage}
          solutionImage={solutionImage}
        />
      </div>

      <div className="flex min-w-0 flex-1 items-stretch">
        <div className="hidden self-stretch bg-white lg:block">
          <Sidebar isOpen onClose={undefined} />
        </div>

        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} forceOverlay />

        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1 bg-[#F9F9F8]">
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8">
            {isGenerating && (
              <div className="rounded-2xl bg-[#F0F0EE] px-6 py-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#5C6BC0]" />
                  <p className="text-base font-medium text-gray-700">해설을 바탕으로 훈련 문제를 만들고 있어요...</p>
                </div>
              </div>
            )}

            {!isGenerating && generationError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                {generationError}
              </div>
            )}

            {!isGenerating && currentQuestion && !isComplete && (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    질문 {currentQuestionIndex + 1} / {questions.length}
                  </p>
                </div>

                {currentQuestionIndex === 0 && (
                  <div className="rounded-2xl bg-[#F0F0EE] px-6 py-5">
                    <p className="text-base text-gray-900">
                      {trainingSet?.intro || '이제 제대로 이해했는지 확인해볼게요.'}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl bg-[#F0F0EE] px-6 py-5">
                  <p className="text-lg font-bold leading-8 text-gray-900">
                    {currentQuestion.question}
                  </p>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswerIndex === index;
                    const isCorrect = currentQuestion.correctOptionIndex === index;
                    const stateClass = showFeedback && isSelected
                      ? isCorrect
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-red-400 bg-red-50 text-red-700'
                      : showFeedback && isCorrect
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-[#5C6BC0] text-[#5C6BC0] hover:bg-[#5C6BC0] hover:text-white';

                    return (
                      <button
                        key={`${option}-${index}`}
                        onClick={() => handleOptionAnswer(index)}
                        disabled={showFeedback}
                        className={`w-full rounded-full border-2 px-5 py-3.5 text-left text-base font-medium transition-colors disabled:cursor-not-allowed ${stateClass}`}
                      >
                        {option}
                      </button>
                    );
                  })}

                  {!showDirectInput ? (
                    <button
                      onClick={() => setShowDirectInput(true)}
                      disabled={showFeedback}
                      className="w-full rounded-full border-2 border-[#5C6BC0] px-5 py-3.5 text-center text-base font-medium text-[#5C6BC0] transition-colors hover:bg-[#5C6BC0] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      직접 입력하기...
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <textarea
                        value={directAnswer}
                        onChange={(event) => setDirectAnswer(event.target.value)}
                        disabled={showFeedback}
                        placeholder="내 말로 답을 써보세요..."
                        className="h-24 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-base focus:border-[#5C6BC0] focus:outline-none"
                      />
                      <button
                        onClick={handleDirectSubmit}
                        disabled={!directAnswer.trim() || showFeedback}
                        className="mt-3 w-full rounded-full bg-[#5C6BC0] px-5 py-3 text-base font-medium text-white transition-colors hover:bg-[#4E5BAD] disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        채점하기
                      </button>
                    </div>
                  )}
                </div>

                {showFeedback && (
                  <div className="space-y-4">
                    <div className={`rounded-xl border px-5 py-4 ${lastAnswerCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start gap-3">
                        {lastAnswerCorrect ? (
                          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                        ) : (
                          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        )}
                        <p className={`text-base leading-relaxed ${lastAnswerCorrect ? 'text-green-900' : 'text-red-900'}`}>
                          {lastAnswerCorrect ? currentQuestion.correctFeedback : currentQuestion.incorrectFeedback}
                        </p>
                      </div>
                    </div>

                    {!lastAnswerCorrect && currentQuestion.missedPoints.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                          <div className="flex-1">
                            <h4 className="mb-2.5 text-base font-bold text-amber-900">
                              이 부분을 다시 확인하세요
                            </h4>
                            <ul className="space-y-2">
                              {currentQuestion.missedPoints.map((point, index) => (
                                <li key={`${point}-${index}`} className="text-sm leading-relaxed text-amber-900">
                                  - {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleNext}
                      className="w-full rounded-full bg-[#5C6BC0] px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-[#4E5BAD]"
                    >
                      {currentQuestionIndex < questions.length - 1 ? '다음 질문으로 →' : '완료하기'}
                    </button>
                  </div>
                )}
              </>
            )}

            {isComplete && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-[#F0F0EE] px-6 py-6 text-center">
                  <p className="mb-2 text-xl font-bold text-gray-900">
                    훈련 완료!
                  </p>
                  <p className="text-base text-gray-700">
                    {questions.length}문제 중 {correctCount}문제를 맞혔어요.
                  </p>
                </div>

                {uniqueMissedPoints.length > 0 && (
                  <div className="rounded-xl border-2 border-[#5C6BC0] bg-indigo-50 px-6 py-5">
                    <h3 className="mb-4 text-lg font-bold text-[#5C6BC0]">
                      꼭 기억하세요
                    </h3>
                    <ul className="space-y-2.5">
                      {uniqueMissedPoints.map((point, index) => (
                        <li key={`${point}-${index}`} className="text-sm leading-relaxed text-gray-900">
                          - {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => navigate('/response', { state: { userMessage: displayProblem, problemText: displayProblem } })}
                    className="rounded-full border-2 border-[#5C6BC0] px-6 py-3.5 text-base font-medium text-[#5C6BC0] transition-colors hover:bg-[#5C6BC0] hover:text-white"
                  >
                    해설로 돌아가기
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="rounded-full bg-[#5C6BC0] px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-[#4E5BAD]"
                  >
                    처음으로 돌아가기
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
