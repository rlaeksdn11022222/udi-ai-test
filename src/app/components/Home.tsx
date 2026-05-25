import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, Upload, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useConversation } from '../contexts/ConversationContext';
import { useUsageLimit } from '../contexts/UsageLimitContext';
import { LoginButton } from './LoginButton';
import { UserProfile } from './UserProfile';
import { TextInputPopup } from './TextInputPopup';
import { PaywallPopup } from './PaywallPopup';
import { Sidebar, MobileMenuButton } from './Sidebar';

const quickStartPrompts = [
  '루트 문제 이해가 안 돼요',
  '이차방정식 풀이를 모르겠어요',
  '수열 점화식이 뭔가요?',
];

const schoolLevels = ['중1', '중2', '중3', '고1', '고2', '고3'];

function generateConversationTitle(message: string): string {
  if (message.includes('이차방정식')) return '이차방정식 질문';
  if (message.includes('루트')) return '루트 문제 이해';
  if (message.includes('수열')) return '수열 점화식';

  const title = message.trim().split(/\s+/).slice(0, 4).join(' ');
  return title.length > 20 ? `${title.slice(0, 20)}...` : title || '수학 질문';
}

export function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addConversation } = useConversation();
  const { canUseExplanation } = useUsageLimit();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [problemImage, setProblemImage] = useState<File | null>(null);
  const [solutionImage, setSolutionImage] = useState<File | null>(null);
  const [problemPreview, setProblemPreview] = useState<string | null>(null);
  const [solutionPreview, setSolutionPreview] = useState<string | null>(null);
  const [imageSchoolLevel, setImageSchoolLevel] = useState('');
  const [visibleQuickStartIndexes, setVisibleQuickStartIndexes] = useState<number[]>([0, 1, 2]);
  const quickStartMeasureRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const startAnalysis = (state: Record<string, unknown>, titleSource: string) => {
    if (!canUseExplanation) {
      setIsPaywallOpen(true);
      return;
    }

    if (isAuthenticated) {
      addConversation({
        id: Date.now().toString(),
        title: generateConversationTitle(titleSource),
        userMessage: titleSource,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    navigate('/response', { state });
  };

  const handleTextAnalyze = (problem: string, solution: string, schoolLevel: string) => {
    const message = problem || solution || '입력한 문제를 분석해 주세요';
    startAnalysis(
      { userMessage: message, problemText: problem, solutionText: solution, schoolLevel },
      message,
    );
  };

  const handleQuickStart = (text: string) => {
    startAnalysis({ userMessage: text }, text);
  };

  const handleProblemUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProblemImage(file);
    setProblemPreview(URL.createObjectURL(file));
  };

  const handleSolutionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSolutionImage(file);
    setSolutionPreview(URL.createObjectURL(file));
  };

  const handleImageAnalyze = () => {
    if (!problemImage || !imageSchoolLevel) return;

    const message = '업로드한 이미지 문제를 분석해 주세요';
    startAnalysis(
      {
        userMessage: message,
        problemImage,
        solutionImage,
        schoolLevel: imageSchoolLevel,
      },
      message,
    );

    setProblemImage(null);
    setSolutionImage(null);
    setProblemPreview(null);
    setSolutionPreview(null);
    setImageSchoolLevel('');
    setIsImageModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsImageModalOpen(false);
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleCloseModal();
    }
  };

  useEffect(() => {
    return () => {
      if (problemPreview) URL.revokeObjectURL(problemPreview);
      if (solutionPreview) URL.revokeObjectURL(solutionPreview);
    };
  }, [problemPreview, solutionPreview]);

  useEffect(() => {
    const getOneLineIndexes = () => {
      const container = quickStartMeasureRef.current;
      if (!container || quickStartPrompts.length <= 2) {
        return quickStartPrompts.map((_, index) => index);
      }

      const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button[data-quick-index]'));
      if (buttons.length === 0) return quickStartPrompts.map((_, index) => index);

      const fitsInOneLine = (indexes: number[]) => {
        buttons.forEach(button => {
          const index = Number(button.dataset.quickIndex);
          button.style.display = indexes.includes(index) ? 'inline-flex' : 'none';
        });

        const visibleButtons = buttons.filter(button => button.style.display !== 'none');
        if (visibleButtons.length <= 1) return true;

        const firstTop = visibleButtons[0].offsetTop;
        return visibleButtons.every(button => Math.abs(button.offsetTop - firstTop) < 2);
      };

      const allIndexes = quickStartPrompts.map((_, index) => index);
      const restoreButtons = () => {
        buttons.forEach(button => {
          button.style.display = '';
        });
      };

      if (fitsInOneLine(allIndexes)) {
        restoreButtons();
        return allIndexes;
      }

      restoreButtons();
      return allIndexes.slice(0, 2);
    };

    const updateVisibleQuestions = () => {
      if (window.innerWidth >= 640) {
        setVisibleQuickStartIndexes(quickStartPrompts.map((_, index) => index));
        return;
      }

      requestAnimationFrame(() => {
        setVisibleQuickStartIndexes(getOneLineIndexes());
      });
    };

    updateVisibleQuestions();
    window.addEventListener('resize', updateVisibleQuestions);
    return () => window.removeEventListener('resize', updateVisibleQuestions);
  }, []);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F9F9F8]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200/50 bg-white px-4 sm:px-8">
        <div className="flex items-center gap-2">
          <MobileMenuButton onClick={() => setIsSidebarOpen(true)} />
          <button
            onClick={() => navigate('/category-dashboard')}
            className="flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-[#5C6BC0] transition-colors hover:bg-indigo-100"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">유형학습하기</span>
          </button>
        </div>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2.5 sm:flex">
          <span className="hidden text-lg font-semibold text-gray-900 sm:inline">UDI AI</span>
        </div>

        <div>{isAuthenticated ? <UserProfile /> : <LoginButton />}</div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} forceOverlay />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[680px] space-y-8">
          <div className="space-y-3 text-center">
            <h1 className="text-[30px] font-bold leading-tight text-gray-900">
              어떤 문제가 이해 안 되나요?
            </h1>
            <p className="text-base text-gray-500">
              문제와 해설을 붙여넣거나 사진을 올려주세요
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTextModalOpen(true)}
              className="flex h-14 w-full items-center rounded-full border border-gray-200 bg-white px-6 text-left text-base text-gray-400 transition-colors hover:border-[#5C6BC0]"
            >
              문제 또는 해설을 입력하세요...
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsImageModalOpen(true);
              }}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#5C6BC0] transition-colors hover:bg-[#4E5BAD]"
              aria-label="이미지 업로드"
            >
              <Upload className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex w-full flex-wrap justify-center gap-2.5 sm:gap-3" ref={quickStartMeasureRef}>
              {quickStartPrompts.map((prompt, index) => (
                <button
                  key={prompt}
                  data-quick-index={index}
                  onClick={() => handleQuickStart(prompt)}
                  className={`w-[calc((100%-0.625rem)/2)] max-w-[210px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#5C6BC0] px-2.5 py-2 text-xs font-medium leading-5 text-[#5C6BC0] transition-colors hover:bg-[#5C6BC0] hover:text-white min-[390px]:px-3.5 min-[390px]:text-[13px] sm:w-auto sm:max-w-none sm:px-5 sm:py-2.5 sm:text-sm ${
                    visibleQuickStartIndexes.includes(index) ? 'inline-flex' : 'hidden'
                  }`}
                >
                  <span className="truncate">{prompt}</span>
                </button>
              ))}
            </div>

            <div className="hidden justify-center sm:flex">
              <button
                onClick={() => setIsTextModalOpen(true)}
                className="rounded-full border-2 border-[#5C6BC0] px-5 py-2.5 text-sm font-medium text-[#5C6BC0] transition-colors hover:bg-[#5C6BC0] hover:text-white"
              >
                직접 입력하기
              </button>
            </div>
          </div>
        </div>
      </main>

      <TextInputPopup
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        onAnalyze={handleTextAnalyze}
      />

      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-8"
          onClick={handleClickOutside}
        >
          <div ref={modalRef} className="relative w-full max-w-4xl rounded-3xl bg-white p-6 sm:p-8">
            <button
              onClick={handleCloseModal}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
              aria-label="닫기"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>

            <div className="mb-6 pr-10">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">이미지 업로드</h2>
              <p className="text-base text-gray-600">
                문제 이미지는 필수이고, 해설 이미지는 있으면 함께 올려주세요.
              </p>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                학년 선택 <span className="text-red-500">*</span>
              </label>
              <select
                value={imageSchoolLevel}
                onChange={(e) => setImageSchoolLevel(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-[#5C6BC0] focus:outline-none"
              >
                <option value="">학년을 선택하세요</option>
                {schoolLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-700">문제 이미지</label>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleProblemUpload} className="hidden" />
                  <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-[#5C6BC0]">
                    {problemPreview ? (
                      <img src={problemPreview} alt="Problem preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="p-6 text-center">
                        <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">눌러서 업로드</p>
                        <p className="mt-1 text-xs text-gray-400">PNG, JPG</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-gray-700">해설 이미지</label>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleSolutionUpload} className="hidden" />
                  <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-[#5C6BC0]">
                    {solutionPreview ? (
                      <img src={solutionPreview} alt="Solution preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="p-6 text-center">
                        <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">있으면 업로드</p>
                        <p className="mt-1 text-xs text-gray-400">선택 사항</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={handleImageAnalyze}
              disabled={!problemImage || !imageSchoolLevel}
              className="w-full rounded-2xl bg-[#5C6BC0] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-[#5C6BC0]/30 transition-colors hover:bg-[#4E5BAD] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
            >
              분석하기
            </button>
          </div>
        </div>
      )}

      <PaywallPopup
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        limitType="explanation"
      />
    </div>
  );
}
