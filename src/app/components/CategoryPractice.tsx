import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Brain, CheckCircle, Loader2, Repeat2, Target, X } from 'lucide-react';
import { CategoryMastery, TrainingType, useCategory } from '../contexts/CategoryContext';
import { Sidebar, MobileMenuButton } from './Sidebar';

interface PracticeQuestion {
  id: number;
  trainingType: TrainingType;
  question: string;
  options: string[];
  correctOptionIndex: number;
  correctAnswer: string;
  explanation: string;
  directAnswerKeywords: string[];
}

interface GeneratedPracticeSet {
  guide: string;
  questions: PracticeQuestion[];
}

const QUESTION_COUNTS = [3, 5, 10];

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

function getTypeLabel(type: TrainingType) {
  if (type === 'approach') return '접근방식유형';
  if (type === 'logic') return '논리적사고유형';
  return '문제변형유형';
}

function getTypeIcon(type: TrainingType) {
  if (type === 'approach') return <Target className="h-4 w-4" />;
  if (type === 'logic') return <Brain className="h-4 w-4" />;
  return <Repeat2 className="h-4 w-4" />;
}

function makeFallbackQuestions(category: CategoryMastery, count: number): PracticeQuestion[] {
  const templates: PracticeQuestion[] = [
    {
      id: 1,
      trainingType: 'approach',
      question: `${category.typeLabel} 문제를 처음 봤을 때 가장 먼저 확인해야 할 것은 무엇인가요?`,
      options: ['문제의 조건과 사용할 개념', '계산을 바로 시작하기', '답의 모양부터 추측하기'],
      correctOptionIndex: 0,
      correctAnswer: '문제의 조건과 사용할 개념',
      explanation: '접근방식유형은 문제를 풀기 전에 어떤 조건을 보고 어떤 도구를 선택할지 판단하는 훈련입니다.',
      directAnswerKeywords: ['조건', '개념', '유형', '확인'],
    },
    {
      id: 2,
      trainingType: 'logic',
      question: `${category.subType} 풀이에서 중간 과정이 중요한 이유는 무엇인가요?`,
      options: ['풀이 이유를 연결해야 실수를 줄일 수 있어서', '식이 길어 보이면 점수가 높아서', '공식을 많이 쓰는 것이 중요해서'],
      correctOptionIndex: 0,
      correctAnswer: '풀이 이유를 연결해야 실수를 줄일 수 있어서',
      explanation: '논리적사고유형은 답만 맞히는 것이 아니라 조건, 공식, 계산 과정이 자연스럽게 이어지는지 확인합니다.',
      directAnswerKeywords: ['이유', '과정', '연결', '논리'],
    },
    {
      id: 3,
      trainingType: 'variation',
      question: `원래 문제 "${category.sourceProblem}"에서 숫자나 조건이 바뀌면 무엇을 유지해야 할까요?`,
      options: ['풀이 구조와 판단 기준', '원래 답', '문제의 글자 수'],
      correctOptionIndex: 0,
      correctAnswer: '풀이 구조와 판단 기준',
      explanation: '문제변형유형은 숫자가 바뀌어도 같은 개념과 풀이 구조를 적용할 수 있는지 보는 훈련입니다.',
      directAnswerKeywords: ['구조', '기준', '개념', '풀이'],
    },
  ];

  return Array.from({ length: count }, (_, index) => ({
    ...templates[index % templates.length],
    id: index + 1,
  }));
}

function isValidPracticeSet(value: unknown): value is GeneratedPracticeSet {
  const data = value as GeneratedPracticeSet;
  return Boolean(
    data &&
      Array.isArray(data.questions) &&
      data.questions.every(question =>
        ['approach', 'logic', 'variation'].includes(question.trainingType) &&
        typeof question.question === 'string' &&
        Array.isArray(question.options) &&
        question.options.length === 3 &&
        Number.isInteger(question.correctOptionIndex) &&
        question.correctOptionIndex >= 0 &&
        question.correctOptionIndex < 3 &&
        typeof question.correctAnswer === 'string' &&
        typeof question.explanation === 'string' &&
        Array.isArray(question.directAnswerKeywords),
      ),
  );
}

async function generateVariationPractice(category: CategoryMastery, count: number): Promise<GeneratedPracticeSet> {
  const prompt = `
너는 사용자가 이미 풀었던 수학 문제를 바탕으로 유형 훈련 문제를 만드는 개인 코치야.

입력으로 다음이 주어진다:
- 현재 문제의 큰 유형
- 현재 문제의 작은 유형
- 원래 풀었던 문제
- 원래 문제의 해설
- 총 문제 수

[입력]
큰 유형: ${category.mainType}
작은 유형: ${category.subType}
정리된 문제 유형: ${category.typeLabel}
원래 문제: ${category.sourceProblem}
원래 해설: ${category.sourceExplanation}
총 문제 수: ${count}

[문제 생성 규칙]
1. 원래 문제를 그대로 다시 내지 말고, 숫자/조건/표현을 바꾼 변형 문제를 만든다.
2. 문제는 접근방식유형, 논리적사고유형, 문제변형유형이 골고루 섞이게 만든다.
3. 접근방식유형은 "무엇을 먼저 봐야 하는가", "어떤 방법을 선택해야 하는가"를 묻는다.
4. 논리적사고유형은 "왜 그 방법이 맞는가", "풀이 흐름에서 빠진 단계가 무엇인가"를 묻는다.
5. 문제변형유형은 실제 변형 계산 문제를 낸다.
6. 각 문제는 보기 3개를 제공하고, 학생이 직접 입력해도 채점할 수 있도록 핵심 키워드를 제공한다.
7. 말투는 짧고 명확하게 쓴다.

반드시 아래 JSON 형식만 출력해. 마크다운, 설명문, 코드블록은 금지.
{
  "guide": "훈련 시작 안내 문장",
  "questions": [
    {
      "id": 1,
      "trainingType": "approach",
      "question": "질문",
      "options": ["보기1", "보기2", "보기3"],
      "correctOptionIndex": 0,
      "correctAnswer": "정답",
      "explanation": "채점 후 보여줄 설명",
      "directAnswerKeywords": ["핵심어1", "핵심어2", "핵심어3"]
    }
  ]
}
`;

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        thinkingConfig: { thinkingLevel: 'minimal' },
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || '유형 훈련 문제 생성에 실패했습니다.');

  const parsed = JSON.parse(stripJsonFence(data.text ?? ''));
  if (!isValidPracticeSet(parsed)) {
    throw new Error('유형 훈련 문제 형식이 올바르지 않습니다.');
  }

  return {
    guide: parsed.guide || `${category.typeLabel} 변형 문제를 풀어볼게요.`,
    questions: parsed.questions.slice(0, count).map((question, index) => ({
      ...question,
      id: index + 1,
      directAnswerKeywords: question.directAnswerKeywords.slice(0, 4),
    })),
  };
}

export function CategoryPractice() {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const { getCategoryMastery, updateMastery } = useCategory();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [practiceSet, setPracticeSet] = useState<GeneratedPracticeSet | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [directAnswer, setDirectAnswer] = useState('');
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const category = getCategoryMastery(categoryId || '');

  useEffect(() => {
    if (!category || !questionCount) return;

    let isMounted = true;
    async function loadPractice() {
      setIsGenerating(true);
      setGenerationError('');

      try {
        const generated = await generateVariationPractice(category, questionCount);
        if (isMounted) setPracticeSet(generated);
      } catch (error) {
        console.error('Category practice generation error:', error);
        if (isMounted) {
          setGenerationError('AI 문제 생성에 실패해서 기본 변형 훈련으로 시작합니다.');
          setPracticeSet({
            guide: `${category.typeLabel}에서 자주 막히는 지점을 변형 문제로 확인해볼게요.`,
            questions: makeFallbackQuestions(category, questionCount),
          });
        }
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    }

    loadPractice();
    return () => {
      isMounted = false;
    };
  }, [category, questionCount]);

  const questions = practiceSet?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex];
  const progressLabel = questionCount ? `${Math.min(currentQuestionIndex + 1, questionCount)} / ${questionCount}` : '';

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F9F8] p-6">
        <div className="max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <h1 className="text-xl font-bold text-gray-950">유형을 찾을 수 없어요</h1>
          <button
            onClick={() => navigate('/category-dashboard')}
            className="mt-5 rounded-full bg-[#5C6BC0] px-5 py-3 font-medium text-white"
          >
            유형 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const submitAnswer = (optionIndex: number | null) => {
    if (!currentQuestion || showExplanation) return;

    const answerText = optionIndex === null ? directAnswer : currentQuestion.options[optionIndex];
    const normalizedAnswer = normalize(answerText);
    const correctOptionText = normalize(currentQuestion.options[currentQuestion.correctOptionIndex]);
    const keywordHits = currentQuestion.directAnswerKeywords.filter(keyword =>
      normalizedAnswer.includes(normalize(keyword)),
    ).length;
    const correct = optionIndex === currentQuestion.correctOptionIndex ||
      normalizedAnswer.includes(correctOptionText) ||
      keywordHits >= Math.min(2, currentQuestion.directAnswerKeywords.length);

    setSelectedAnswerIndex(optionIndex);
    setIsCorrect(correct);
    setShowExplanation(true);
    if (correct) setCorrectCount(count => count + 1);
    updateMastery(category.id, correct, currentQuestion.trainingType);
  };

  const goNext = () => {
    if (currentQuestionIndex >= questions.length - 1) {
      setCompleted(true);
      return;
    }

    setCurrentQuestionIndex(index => index + 1);
    setSelectedAnswerIndex(null);
    setDirectAnswer('');
    setShowDirectInput(false);
    setShowExplanation(false);
    setIsCorrect(false);
  };

  const Header = (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200/50 bg-white px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <MobileMenuButton onClick={() => setIsSidebarOpen(true)} />
        <button
          onClick={() => navigate('/category-dashboard')}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          aria-label="유형 목록으로 돌아가기"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg">{category.typeLabel}</h1>
        </div>
      </div>
      {progressLabel && <span className="text-sm font-medium text-gray-500">{progressLabel}</span>}
    </header>
  );

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F9F9F8]">
      {Header}

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

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-3xl space-y-6">
            {!questionCount && (
              <>
                <section className="rounded-2xl border border-gray-200 bg-white p-6">
                  <p className="text-sm font-semibold text-[#5C6BC0]">유형저장결과</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-950">{category.typeLabel}</h2>
                  <p className="mt-3 text-base leading-relaxed text-gray-600">
                    네가 풀었던 문제를 그대로 반복하지 않고, 같은 개념과 풀이 구조를 가진 변형 문제로 훈련합니다.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-950">풀 문제 수를 선택하세요</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {QUESTION_COUNTS.map(count => (
                      <button
                        key={count}
                        onClick={() => setQuestionCount(count)}
                        className="rounded-2xl border-2 border-gray-200 bg-white p-5 text-center transition-colors hover:border-[#5C6BC0]"
                      >
                        <div className="text-3xl font-bold text-[#5C6BC0]">{count}</div>
                        <div className="mt-1 text-sm text-gray-600">문제</div>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {questionCount && isGenerating && (
              <div className="rounded-2xl bg-[#F0F0EE] px-6 py-8">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#5C6BC0]" />
                  <p className="text-base font-medium text-gray-700">풀었던 문제를 바탕으로 변형 문제를 만들고 있어요...</p>
                </div>
              </div>
            )}

            {questionCount && !isGenerating && generationError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                {generationError}
              </div>
            )}

            {questionCount && !isGenerating && currentQuestion && !completed && (
              <>
                {currentQuestionIndex === 0 && (
                  <div className="rounded-2xl bg-[#F0F0EE] px-6 py-5">
                    <p className="text-base text-gray-900">{practiceSet?.guide}</p>
                  </div>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-[#5C6BC0]">
                    {getTypeIcon(currentQuestion.trainingType)}
                    {getTypeLabel(currentQuestion.trainingType)}
                  </div>
                  <p className="text-lg font-bold leading-8 text-gray-950">{currentQuestion.question}</p>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const selected = selectedAnswerIndex === index;
                    const correctOption = currentQuestion.correctOptionIndex === index;
                    const stateClass = showExplanation && selected
                      ? correctOption
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-red-400 bg-red-50 text-red-700'
                      : showExplanation && correctOption
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-[#5C6BC0] text-[#5C6BC0] hover:bg-[#5C6BC0] hover:text-white';

                    return (
                      <button
                        key={`${option}-${index}`}
                        onClick={() => submitAnswer(index)}
                        disabled={showExplanation}
                        className={`w-full rounded-full border-2 px-5 py-3.5 text-left text-base font-medium transition-colors disabled:cursor-not-allowed ${stateClass}`}
                      >
                        {option}
                      </button>
                    );
                  })}

                  {!showDirectInput ? (
                    <button
                      onClick={() => setShowDirectInput(true)}
                      disabled={showExplanation}
                      className="w-full rounded-full border-2 border-[#5C6BC0] px-5 py-3.5 text-center text-base font-medium text-[#5C6BC0] transition-colors hover:bg-[#5C6BC0] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      직접 입력하기...
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <textarea
                        value={directAnswer}
                        onChange={(event) => setDirectAnswer(event.target.value)}
                        disabled={showExplanation}
                        placeholder="내 풀이 방향을 직접 써보세요..."
                        className="h-24 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-base focus:border-[#5C6BC0] focus:outline-none"
                      />
                      <button
                        onClick={() => submitAnswer(null)}
                        disabled={!directAnswer.trim() || showExplanation}
                        className="mt-3 w-full rounded-full bg-[#5C6BC0] px-5 py-3 text-base font-medium text-white transition-colors hover:bg-[#4E5BAD] disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        채점하기
                      </button>
                    </div>
                  )}
                </div>

                {showExplanation && (
                  <div className="space-y-4">
                    <div className={`rounded-xl border px-5 py-4 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                        ) : (
                          <X className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        )}
                        <div>
                          <p className={`text-base font-bold ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                            {isCorrect ? '정답입니다' : '다시 확인해야 해요'}
                          </p>
                          {!isCorrect && (
                            <p className="mt-1 text-sm text-red-900">정답: {currentQuestion.correctAnswer}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#F0F0EE] px-6 py-5">
                      <h3 className="mb-3 text-lg font-bold text-[#5C6BC0]">해설</h3>
                      <p className="whitespace-pre-line text-base leading-relaxed text-gray-900">
                        {currentQuestion.explanation}
                      </p>
                    </div>

                    <button
                      onClick={goNext}
                      className="w-full rounded-full bg-[#5C6BC0] px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-[#4E5BAD]"
                    >
                      {currentQuestionIndex < questions.length - 1 ? '다음 문제로' : '결과 보기'}
                    </button>
                  </div>
                )}
              </>
            )}

            {completed && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
                  <p className="text-sm font-semibold text-[#5C6BC0]">훈련 완료</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-950">
                    {questions.length}문제 중 {correctCount}문제를 맞혔어요
                  </h2>
                  <p className="mt-3 text-base text-gray-600">
                    결과는 {category.typeLabel} 성취도에 반영되었습니다.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-bold text-gray-950">유형저장결과 반영 방식</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>유형: {category.typeLabel}</p>
                    <p>전체 성취도: 접근방식유형, 논리적사고유형, 문제변형유형 정답률의 평균</p>
                    <p>채점: 객관식은 선택한 보기로, 직접 입력은 핵심 키워드 포함 여부로 판정</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => navigate('/category-dashboard')}
                    className="rounded-full border-2 border-[#5C6BC0] px-6 py-3.5 text-base font-medium text-[#5C6BC0] transition-colors hover:bg-[#5C6BC0] hover:text-white"
                  >
                    유형 목록으로 돌아가기
                  </button>
                  <button
                    onClick={() => {
                      setQuestionCount(null);
                      setPracticeSet(null);
                      setCompleted(false);
                      setCurrentQuestionIndex(0);
                      setCorrectCount(0);
                    }}
                    className="rounded-full bg-[#5C6BC0] px-6 py-3.5 text-base font-medium text-white transition-colors hover:bg-[#4E5BAD]"
                  >
                    다시 훈련하기
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
