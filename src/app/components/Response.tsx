import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { AlertTriangle, CheckCircle2, ClipboardList, HelpCircle, Lightbulb, Loader2, Send } from 'lucide-react';
import { PinnedProblem } from './PinnedProblem';
import { Sidebar, MobileMenuButton } from './Sidebar';
import { LoginPromptPopup } from './LoginPromptPopup';
import { PaywallPopup } from './PaywallPopup';
import { useAuth } from '../contexts/AuthContext';
import { useConversation } from '../contexts/ConversationContext';
import { useUsageLimit } from '../contexts/UsageLimitContext';

const initialFollowUpQuestions = [
  '판별식을 왜 먼저 계산해야 하나요?',
  '부호를 자주 틀리는데 어떻게 조심하나요?',
  '인수분해랑 근의 공식 중 어떤 걸 먼저 시도해야 하나요?',
];

interface ExplanationSection {
  title: string;
  body: string;
}

const sectionIconMap: Record<string, React.ElementType> = {
  '문제를 보고 가장 먼저 해야 할 일': HelpCircle,
  '왜 이 방법을 선택할까?': ClipboardList,
  '이제 실제로 풀어봅시다': ClipboardList,
  정답: CheckCircle2,
  '많이 막히는 이유': AlertTriangle,
  '다음에 비슷한 문제를 만나면': Lightbulb,
};

const parseExplanationSections = (text: string): ExplanationSection[] => {
  const matches = [...text.matchAll(/\[([^\]]+)\]/g)];
  if (matches.length === 0) return [{ title: '', body: text }];

  return matches
    .map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index ?? text.length : text.length;
      return {
        title: match[1].trim(),
        body: text.slice(start, end).trim(),
      };
    })
    .filter(section => section.title !== '추천질문' && section.body);
};

const renderInlineEmphasis = (line: string) => {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-gray-950">{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

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
    <div className="w-full min-w-0 space-y-0 overflow-hidden rounded-2xl bg-[#F1F1EF]">
      {sections.map((section, sectionIndex) => {
        const Icon = sectionIconMap[section.title] ?? HelpCircle;
        const lines = section.body.split('\n').map(line => line.trim()).filter(Boolean);
        const isAnswer = section.title === '정답';
        const isWarning = section.title === '많이 막히는 이유';
        const isNext = section.title === '다음에 비슷한 문제를 만나면';

        return (
          <section
            key={`${section.title}-${sectionIndex}`}
            className={`min-w-0 px-4 py-5 sm:px-7 sm:py-6 ${sectionIndex > 0 ? 'border-t border-gray-300/70' : ''}`}
          >
            {section.title && !isAnswer && !isWarning && !isNext && (
              <h3 className="mb-5 flex min-w-0 items-start gap-2 break-keep text-lg font-bold leading-7 text-[#5C6BC0] sm:text-xl">
                <Icon className="mt-1 h-5 w-5 shrink-0" />
                {section.title}
              </h3>
            )}

            {isAnswer ? (
              <div className="min-w-0 rounded-2xl border-2 border-[#5C6BC0] bg-indigo-50/70 px-4 py-4 sm:px-5">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#5C6BC0]">
                  <Icon className="h-5 w-5 shrink-0" />
                  최종 답
                </h3>
                <div className="min-w-0 space-y-2 break-words text-[15px] leading-8 text-gray-950 sm:text-base">
                  {lines.map((line, index) => (
                    <p key={index}>{renderInlineEmphasis(line.replace(/^-\s*/, ''))}</p>
                  ))}
                </div>
              </div>
            ) : isWarning ? (
              <div className="min-w-0 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-5 sm:px-5">
                <h3 className="mb-4 flex items-start gap-2 break-keep text-lg font-bold text-amber-900">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-amber-500" />
                  많은 학생들이 여기서 막히는 이유
                </h3>
                <ul className="min-w-0 space-y-2 pl-5 text-[15px] leading-8 text-amber-950 sm:text-base">
                  {lines.map((line, index) => (
                    <li key={index} className="list-disc break-words">{renderInlineEmphasis(line.replace(/^-\s*/, ''))}</li>
                  ))}
                </ul>
              </div>
            ) : isNext ? (
              <div className="min-w-0 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-5 sm:px-5">
                <h3 className="mb-4 flex items-start gap-2 break-keep text-lg font-bold text-indigo-900">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-yellow-500" />
                  다음에 이런 문제를 만나면
                </h3>
                <div className="min-w-0 space-y-2 break-words text-[15px] leading-8 text-indigo-950 sm:text-base">
                  {lines.map((line, index) => (
                    <p key={index} className={/^\d+단계/.test(line) ? 'font-semibold' : ''}>
                      {renderInlineEmphasis(line.replace(/^-\s*/, ''))}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="min-w-0 space-y-4 break-words text-[15px] leading-8 text-gray-950 sm:text-base">
                {lines.map((line, index) => {
                  const cleanLine = line.replace(/^-\s*/, '');
                  const isHighlight = cleanLine.startsWith('→');
                  return (
                    <p
                      key={index}
                      className={isHighlight ? 'pl-4 text-red-500 sm:pl-5' : ''}
                    >
                      {renderInlineEmphasis(cleanLine)}
                    </p>
                  );
                })}
              </div>
            )}
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
    schoolLevel,
  } = location.state || {
    userMessage: '이차방정식 2x² + 5x - 3 = 0을 풀어주세요',
    schoolLevel: '중3',
  };

  const { isAuthenticated } = useAuth();
  const {
    sendMessageToGemini,
    currentConversation,
    isLoading: isGeminiLoading,
  } = useConversation();
  const {
    canUseExplanation,
    canUseFollowUp,
    incrementExplanation,
    incrementFollowUp,
    explanationCount,
  } = useUsageLimit();

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

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

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
          setCurrentFollowUps,
        );
      } catch (error) {
        console.error('Gemini initial explanation error:', error);
      } finally {
        setIsInitialLoading(false);
        scrollToBottom();
      }
    }

    fetchInitialExplanation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, isGeminiLoading]);

  useEffect(() => {
    const getOneLineIndexes = () => {
      const container = followUpMeasureRef.current;
      if (!container || currentFollowUps.length <= 1) {
        return currentFollowUps.map((_, index) => index);
      }

      const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button[data-follow-up-index]'));
      if (buttons.length === 0) return currentFollowUps.map((_, index) => index);

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

      const allIndexes = currentFollowUps.map((_, index) => index);
      let result = allIndexes;

      if (fitsInOneLine(allIndexes)) {
        buttons.forEach(button => {
          button.style.display = '';
        });
        return result;
      }

      for (const removeIndex of allIndexes) {
        const candidate = allIndexes.filter(index => index !== removeIndex);
        if (fitsInOneLine(candidate)) {
          result = candidate;
          buttons.forEach(button => {
            button.style.display = '';
          });
          return result;
        }
      }

      const fallback: number[] = [];
      for (const index of allIndexes) {
        const candidate = [...fallback, index];
        if (fitsInOneLine(candidate)) fallback.push(index);
      }

      result = fallback.length > 0 ? fallback : [0];
      buttons.forEach(button => {
        button.style.display = '';
      });
      return result;
    };

    const updateVisibleQuestions = () => {
      if (window.innerWidth >= 640) {
        setVisibleFollowUpIndexes(currentFollowUps.map((_, index) => index));
        return;
      }

      requestAnimationFrame(() => {
        setVisibleFollowUpIndexes(getOneLineIndexes());
      });
    };

    updateVisibleQuestions();
    window.addEventListener('resize', updateVisibleQuestions);
    return () => window.removeEventListener('resize', updateVisibleQuestions);
  }, [currentFollowUps]);

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
      await sendMessageToGemini(questionText, explanationCount, incrementFollowUp);

      if (!isAuthenticated) {
        const guestCount = Number(localStorage.getItem('guestResponseCount') || '0') + 1;
        localStorage.setItem('guestResponseCount', String(guestCount));
        if (guestCount >= 3) setShowLoginPrompt(true);
      }
    } catch (error) {
      console.error('Gemini follow-up error:', error);
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

  const mainExplanationText = currentConversation?.messages?.[1]?.parts[0]?.text || '';
  const followUpMessages = currentConversation?.messages?.slice(2) || [];

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
      <div className="sticky top-0 z-30 w-full max-w-full">
        <div className="h-14 bg-white border-b border-gray-200/50 px-4 flex items-center">
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

        <div>
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} forceOverlay />
        </div>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex min-w-0 flex-1 flex-col bg-[#F9F9F8]">
          <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 sm:px-8 sm:py-8">
            <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
            <div className="flex justify-end">
              <div className="max-w-[88%] break-words bg-white border border-gray-200/80 rounded-2xl px-4 py-3 text-left sm:max-w-[70%] sm:px-5 sm:py-3.5">
                <p className="text-[15px] leading-7 text-gray-900 sm:text-base">{userMessage}</p>
              </div>
            </div>

            <div className="w-full min-w-0">
              <div className="min-w-0 rounded-2xl bg-[#F0F0EE] px-2 py-2 sm:px-6 sm:py-6">
                {(isInitialLoading || isGeminiLoading) && !mainExplanationText ? (
                  <div className="flex items-center gap-3 py-4">
                    <Loader2 className="w-6 h-6 text-[#5C6BC0] animate-spin" />
                    <p className="text-base font-medium text-gray-700">문제를 분석하고 있어요...</p>
                  </div>
                ) : (
                  <StructuredExplanation text={mainExplanationText} />
                )}
              </div>
            </div>

            {followUpMessages.map((message, index) => (
              <div className="space-y-2" key={`${message.role}-${index}`}>
                {message.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[88%] break-words bg-white border border-gray-200/80 rounded-2xl px-4 py-3 sm:max-w-[70%] sm:px-5 sm:py-3.5">
                      <p className="text-[15px] leading-7 text-gray-900 sm:text-base">{message.parts[0].text}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full min-w-0">
                    <div className="min-w-0 rounded-2xl bg-[#F0F0EE] px-4 py-5 sm:px-6">
                      {message.parts[0].text === '' ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 text-[#5C6BC0] animate-spin" />
                          <p className="text-base text-gray-600">답변을 타이핑하고 있어요...</p>
                        </div>
                      ) : (
                        <p className="break-words text-[15px] leading-7 text-gray-900 whitespace-pre-line sm:text-base">
                          {message.parts[0].text}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {!isGeminiLoading && !isInitialLoading && currentFollowUps.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2.5" ref={followUpMeasureRef}>
                  {currentFollowUps.map((question, index) => (
                    !question.includes('AI 코치와 훈련하기') && (
                      <button
                        key={`${question}-${index}`}
                        data-follow-up-index={index}
                        onClick={() => askFollowUpToGemini(question)}
                        className={`shrink-0 items-center px-4 py-2.5 border-2 border-[#5C6BC0] text-[#5C6BC0] rounded-full hover:bg-[#5C6BC0] hover:text-white transition-colors text-sm font-medium ${
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
            <div className="max-w-3xl mx-auto relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!canUseFollowUp || isInitialLoading || isGeminiLoading}
                placeholder={canUseFollowUp ? '일타강사 제미나이에게 추가로 물어보세요...' : '무료 사용량을 모두 사용했습니다'}
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
