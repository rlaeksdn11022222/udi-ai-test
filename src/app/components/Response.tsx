import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Check, Lightbulb, Loader2, Send, Shuffle, TriangleAlert } from 'lucide-react';
import { PinnedProblem } from './PinnedProblem';
import { Sidebar, MobileMenuButton } from './Sidebar';
import { LoginPromptPopup } from './LoginPromptPopup';
import { PaywallPopup } from './PaywallPopup';
import { useAuth } from '../contexts/AuthContext';
import { useConversation } from '../contexts/ConversationContext';
import { useUsageLimit } from '../contexts/UsageLimitContext';

const initialFollowUpQuestions = [
  "판별식을 왜 먼저 계산해야 하나요?",
  "부호를 자주 틀리는데 어떻게 조심하나요?",
  "인수분해랑 근의 공식 중 어떤 걸 먼저 시도해야 하나요?"
];

const sectionIcons: Record<string, React.ReactNode> = {
  '문제를 보고 가장 먼저 해야 할 일': <span className="text-xl">🤔</span>,
  '왜 이 방법을 선택할까?': <Shuffle className="h-5 w-5 rounded bg-blue-400 p-0.5 text-white" />,
  '정답': <Check className="h-5 w-5 text-[#5C6BC0]" />,
  '많이 막히는 이유': <TriangleAlert className="h-5 w-5 text-amber-500" />,
  '다음에 비슷한 문제를 만나면': <Lightbulb className="h-5 w-5 text-amber-400" />,
};

function parseExplanationSections(text: string) {
  const sections: { title: string; body: string }[] = [];
  const matches = Array.from(text.matchAll(/\[([^\]]+)\]/g));

  if (matches.length === 0) {
    return [{ title: '해설', body: text.trim() }];
  }

  matches.forEach((match, index) => {
    const title = match[1].trim();
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    const body = text.slice(start, end).trim();

    if (title !== '해설본문' || body) {
      sections.push({ title, body });
    }
  });

  return sections.filter(section => section.body || section.title !== '해설본문');
}

function renderInlineEmphasis(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
}

function renderBody(body: string) {
  return body
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const normalized = line.replace(/^-\s*/, '');
      const isImportant = normalized.startsWith('→');

      return (
        <p
          key={`${normalized}-${index}`}
          className={`break-words leading-8 ${isImportant ? 'pl-5 text-[#FF3B30]' : 'text-gray-950'}`}
        >
          {renderInlineEmphasis(normalized)}
        </p>
      );
    });
}

function StructuredExplanation({ text }: { text: string }) {
  if (!text.trim()) {
    return (
      <div className="flex min-h-28 items-center gap-3 rounded-2xl bg-[#F1F1EF] px-5 py-5 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin text-[#5C6BC0]" />
        <p className="text-base font-medium">답변을 준비하고 있어요...</p>
      </div>
    );
  }

  const sections = parseExplanationSections(text);

  return (
    <div className="space-y-6">
      {sections.map((section, index) => {
        const isAnswer = section.title === '정답';
        const isWarning = section.title === '많이 막히는 이유';
        const isNext = section.title === '다음에 비슷한 문제를 만나면';
        const isSpecial = isAnswer || isWarning || isNext;
        const title = isAnswer ? '최종 답' : section.title;

        if (isSpecial) {
          return (
            <section
              key={`${section.title}-${index}`}
              className={`rounded-2xl border px-5 py-5 sm:px-7 ${
                isAnswer
                  ? 'border-[#5C6BC0] bg-[#EEF2FF]'
                  : isWarning
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-blue-200 bg-[#EEF3FF]'
              }`}
            >
              <h3 className={`mb-3 flex items-center gap-2 text-lg font-bold ${
                isWarning ? 'text-amber-950' : 'text-[#4F60C8]'
              }`}>
                {sectionIcons[section.title]}
                {title}
              </h3>
              <div className={isWarning ? 'space-y-1 text-amber-950' : 'space-y-1 text-[#151C64]'}>
                {renderBody(section.body)}
              </div>
            </section>
          );
        }

        return (
          <section key={`${section.title}-${index}`} className={index > 0 ? 'border-t border-gray-200 pt-6' : ''}>
            {section.title !== '해설본문' && section.title !== '해설' && (
              <h3 className="mb-4 flex items-center gap-3 text-xl font-bold text-[#5C6BC0] sm:text-2xl">
                {sectionIcons[section.title]}
                {section.title}
              </h3>
            )}
            <div className="space-y-2 text-base sm:text-lg">
              {renderBody(section.body)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function Response() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    userMessage,
    problemImage,
    solutionImage,
    problemText,
    solutionText,
    schoolLevel
  } = location.state || { userMessage: '이차방정식 2x² + 5x - 3 = 0을 풀어주세요', schoolLevel: '중3' };
  
  const { isAuthenticated } = useAuth();
  const { guestResponseCount, incrementGuestResponses, sendMessageToGemini, currentConversation, isLoading: isGeminiLoading } = useConversation();
  const { canUseExplanation, canUseFollowUp, incrementExplanation, incrementFollowUp, explanationCount } = useUsageLimit();
  
  const [input, setInput] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [currentFollowUps, setCurrentFollowUps] = useState<string[]>(initialFollowUpQuestions);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallType, setPaywallType] = useState<'explanation' | 'followup'>('explanation');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visibleFollowUpIndexes, setVisibleFollowUpIndexes] = useState<number[]>([0, 1, 2]);
  const followUpMeasureRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. 페이지 진입 시 제미나이에게 최초 문제 정밀 분석/해설 요청
  useEffect(() => {
    if (!canUseExplanation) {
      setPaywallType('explanation');
      setShowPaywall(true);
      return;
    }

    async function fetchInitialExplanation() {
      setIsInitialLoading(true);
      try {
        const initialTriggerPrompt = `
          학년 수준: ${schoolLevel || '중3'}
          사용자 요청/문제: ${problemText || userMessage}
        `;

        await sendMessageToGemini(
          initialTriggerPrompt, 
          explanationCount, 
          incrementExplanation,
          schoolLevel || '중3',
          solutionText || '없음',
          setCurrentFollowUps 
        );
        
      } catch (error) {
        console.error("제미나이 메인 풀이 생성 에러:", error);
      } finally {
        setIsInitialLoading(false);
        scrollToBottom();
      }
    }

    fetchInitialExplanation();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  // 자동 스크롤 추적
  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, isGeminiLoading]);

  useEffect(() => {
    const updateVisibleQuestions = () => {
      if (window.innerWidth >= 640) {
        setVisibleFollowUpIndexes(currentFollowUps.map((_, index) => index));
        return;
      }

      requestAnimationFrame(() => {
        const container = followUpMeasureRef.current;
        const buttons = Array.from(container?.querySelectorAll<HTMLButtonElement>('button[data-follow-up-index]') ?? []);
        const allIndexes = currentFollowUps.map((_, index) => index);

        if (!container || buttons.length === 0) {
          setVisibleFollowUpIndexes(allIndexes);
          return;
        }

        const fitsInOneLine = (indexes: number[]) => {
          buttons.forEach(button => {
            const index = Number(button.dataset.followUpIndex);
            button.style.display = indexes.includes(index) ? 'inline-flex' : 'none';
          });

          const visibleButtons = buttons.filter(button => button.style.display !== 'none');
          if (visibleButtons.length <= 1) return true;

          const firstTop = visibleButtons[0].offsetTop;
          return visibleButtons.every(button => Math.abs(button.offsetTop - firstTop) < 2);
        };

        if (fitsInOneLine(allIndexes)) {
          buttons.forEach(button => {
            button.style.display = '';
          });
          setVisibleFollowUpIndexes(allIndexes);
          return;
        }

        const fallback: number[] = [];
        for (const index of allIndexes) {
          const candidate = [...fallback, index];
          if (fitsInOneLine(candidate)) fallback.push(index);
        }

        buttons.forEach(button => {
          button.style.display = '';
        });
        setVisibleFollowUpIndexes(fallback.length > 0 ? fallback : [0]);
      });
    };

    updateVisibleQuestions();
    window.addEventListener('resize', updateVisibleQuestions);
    return () => window.removeEventListener('resize', updateVisibleQuestions);
  }, [currentFollowUps]);

  // 2. 꼬리질문 요청 핸들러 (UI 이중 상태 관리 제거, 직접 전송)
  const askFollowUpToGemini = async (questionText: string) => {
    if (questionText.includes('AI 코치와 훈련하기')) {
      navigate('/training', { state: { userMessage } });
      return;
    }

    if (!canUseFollowUp) {
      setPaywallType('followup');
      setShowPaywall(true);
      return;
    }

    try {
      // 프롬프트는 Context에서 주입하므로 순수 질문 텍스트만 넘김
      await sendMessageToGemini(questionText, explanationCount, incrementFollowUp);

      if (!isAuthenticated) {
        incrementGuestResponses();
      }
    } catch (error) {
      console.error("제미나이 추가 질문 처리 에러:", error);
    } finally {
      scrollToBottom();
    }
  };

  const handleSendMessage = () => {
    if (!input.trim() || isInitialLoading || isGeminiLoading) return;
    const userQuery = input;
    setInput('');
    askFollowUpToGemini(userQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (!isAuthenticated && guestResponseCount >= 3) {
      setShowLoginPrompt(true);
    }
  }, [isAuthenticated, guestResponseCount]);

  // 데이터 파싱
  const mainExplanationText = currentConversation?.messages[1]?.parts[0]?.text || '';
  // 첫 번째(0)와 두 번째(1) 인덱스를 제외한 나머지가 모두 꼬리질문 히스토리
  const followUpMessages = currentConversation?.messages.slice(2) || [];

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
      <div className="sticky top-0 z-30 w-full max-w-full">
        <div className="flex h-14 items-center border-b border-gray-200/50 bg-white px-4">
          <MobileMenuButton onClick={() => setIsSidebarOpen(true)} />
        </div>
        <PinnedProblem
          problemText={problemText || userMessage}
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

        <main className="flex min-w-0 flex-1 flex-col bg-[#F9F9F8]">
          <div className="min-w-0 flex-1 overflow-x-hidden px-3 py-5 sm:px-8 sm:py-8">
            <div className="mx-auto w-full max-w-5xl space-y-6">
            
            {/* 유저가 처음 보낸 메인 질문 */}
            <div className="flex justify-end">
              <div className="max-w-[88%] break-words rounded-2xl border border-gray-200/80 bg-white px-4 py-3 text-left sm:max-w-[70%] sm:px-5 sm:py-3.5">
                <p className="text-[15px] leading-7 text-gray-900 sm:text-base">{userMessage}</p>
              </div>
            </div>

            {/* AI 핵심 해설 출력부 (스트리밍 즉각 반응형 UI 적용) */}
            <div className="w-full min-w-0">
              <div className="min-w-0 rounded-2xl bg-[#F0F0EE] px-4 py-5 sm:px-8 sm:py-8">
                {(isInitialLoading || isGeminiLoading) && !mainExplanationText ? (
                  <div className="flex items-center gap-3 py-4">
                    <Loader2 className="w-6 h-6 text-[#5C6BC0] animate-spin" />
                    <p className="text-base text-gray-700 font-medium">문제를 분석하고 있어요...</p>
                  </div>
                ) : (
                  <StructuredExplanation text={mainExplanationText} />
                )}
              </div>
            </div>

            {/* 꼬리질문 히스토리 실시간 렌더링 */}
            {followUpMessages.map((message, index) => (
              <div className="space-y-2" key={index}>
                {message.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[88%] break-words rounded-2xl border border-gray-200/80 bg-white px-4 py-3 text-left sm:max-w-[70%] sm:px-5 sm:py-3.5">
                      <p className="text-[15px] leading-7 text-gray-900 sm:text-base">{message.parts[0].text}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full min-w-0">
                    <div className="min-w-0 rounded-2xl bg-[#F0F0EE] px-4 py-5 sm:px-8 sm:py-6">
                      {/* 아직 청크(Chunk)가 도착하기 전의 아주 짧은 로딩 상태 */}
                      {message.parts[0].text === '' ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 text-[#5C6BC0] animate-spin" />
                          <p className="text-base text-gray-600">답변을 타이핑하고 있어요...</p>
                        </div>
                      ) : (
                        <StructuredExplanation text={message.parts[0].text} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 꼬리질문 추천 버튼 칩스 */}
            {!isGeminiLoading && !isInitialLoading && currentFollowUps.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2.5" ref={followUpMeasureRef}>
                  {currentFollowUps.map((question, index) => (
                    !question.includes('AI 코치와 훈련하기') && (
                      <button
                        key={index}
                        data-follow-up-index={index}
                        onClick={() => askFollowUpToGemini(question)}
                        className={`shrink-0 items-center rounded-full border-2 border-[#5C6BC0] px-4 py-2.5 text-sm font-medium text-[#5C6BC0] transition-colors hover:bg-[#5C6BC0] hover:text-white ${
                          visibleFollowUpIndexes.includes(index) ? 'inline-flex' : 'hidden'
                        }`}
                      >
                        {question}
                      </button>
                    )
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-200/50">
                  <button
                    onClick={() => navigate('/training', { state: { userMessage } })}
                    className="px-4 py-2.5 border-2 border-[#5C6BC0] text-[#5C6BC0] rounded-full hover:bg-[#5C6BC0] hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
                  >
                    AI 코치와 훈련하기 →
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-gray-200/50 bg-[#F9F9F8] px-3 py-3 sm:px-8 sm:py-4">
            <div className="relative mx-auto max-w-3xl">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!canUseFollowUp || isInitialLoading || isGeminiLoading}
                placeholder={canUseFollowUp ? "AI에게 추가로 질문하세요..." : "무료 사용량을 모두 사용했습니다"}
                className={`w-full h-12 pl-5 pr-14 bg-white border border-gray-200 rounded-full text-base placeholder:text-gray-400 focus:outline-none focus:border-[#5C6BC0] transition-colors ${!canUseFollowUp ? 'cursor-not-allowed bg-gray-50' : ''}`}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || !canUseFollowUp || isGeminiLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#5C6BC0] rounded-full flex items-center justify-center hover:bg-[#4E5BAD] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </main>
      </div>

      <LoginPromptPopup isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
      <PaywallPopup isOpen={showPaywall} onClose={() => setShowPaywall(false)} limitType={paywallType} />
    </div>
  );
}
