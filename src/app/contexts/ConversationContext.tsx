import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GoogleGenAI } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface Conversation {
  id: string;
  title: string;
  userMessage?: string;
  messages?: Message[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConversationContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  addConversation: (conversation: Conversation) => void;
  sendMessageToGemini: (
    text: string,
    explanationCount: number,
    incrementCount: () => boolean | void,
    schoolLevel?: string,
    solutionText?: string,
    setFollowUps?: (questions: string[]) => void
  ) => Promise<string>;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  isLoading: boolean;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);
const MODEL_NAME = 'gemini-3.1-flash-lite';

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const addConversation = (conversation: Conversation) => {
    setConversations(prev => [conversation, ...prev.filter(c => c.id !== conversation.id)]);
  };

  const upsertConversation = (conversation: Conversation) => {
    setConversations(prev => {
      const exists = prev.some(c => c.id === conversation.id);
      if (exists) return prev.map(c => c.id === conversation.id ? conversation : c);
      return [conversation, ...prev];
    });
  };

  const sendMessageToGemini = async (
    text: string,
    _explanationCount: number,
    incrementCount: () => boolean | void,
    schoolLevel: string = '중3',
    solutionText: string = '없음',
    setFollowUps?: (questions: string[]) => void
  ): Promise<string> => {
    if (!text.trim()) return '';

    const isInitialRequest = text.includes('학년 수준:');

    if (!geminiApiKey) {
      const missingKeyMessage = 'Gemini API 키가 설정되지 않았습니다. Vercel Environment Variables에 VITE_GEMINI_API_KEY를 추가한 뒤 Redeploy 해 주세요.';
      const fallbackConversation: Conversation = {
        id: Date.now().toString(),
        title: isInitialRequest ? '수학 분석' : text.slice(0, 20) || '추가 질문',
        userMessage: text,
        messages: [
          { role: 'user', parts: [{ text: isInitialRequest ? '수학 문제 분석 요청' : text }] },
          { role: 'model', parts: [{ text: missingKeyMessage }] },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setCurrentConversation(fallbackConversation);
      upsertConversation(fallbackConversation);
      return missingKeyMessage;
    }

    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      if (!isInitialRequest) {
        const userMessage: Message = { role: 'user', parts: [{ text }] };
        const modelMessage: Message = { role: 'model', parts: [{ text: '' }] };
        const baseMessages = currentConversation?.messages ?? [];

        const updatedConversation: Conversation = currentConversation
          ? { ...currentConversation, messages: [...baseMessages, userMessage, modelMessage], updatedAt: new Date() }
          : {
              id: Date.now().toString(),
              title: text.slice(0, 20) || '추가 질문',
              userMessage: text,
              messages: [userMessage, modelMessage],
              createdAt: new Date(),
              updatedAt: new Date(),
            };

        setCurrentConversation(updatedConversation);

        const chatHistory = (updatedConversation.messages ?? []).slice(0, -1).map(msg => ({
          role: msg.role,
          parts: [{ text: msg.parts[0]?.text ?? '' }],
        }));

        const responseStream = await ai.models.generateContentStream({
          model: MODEL_NAME,
          contents: chatHistory,
          config: {
            thinkingConfig: { thinkingLevel: 'minimal' },
            systemInstruction: `너는 수학 개인 코치야. 사용자의 추가 질문에 답할 때는 이전 해설을 길게 반복하지 말고, 질문과 직접 관련된 핵심만 짧고 명확하게 설명해.
규칙: 1. 답변은 최대 3~5문장. 2. 가장 중요한 개념과 이유를 먼저 말하기. 3. 쉬운 말로 설명하기. 4. 불필요한 장황한 설명 금지.`,
          },
        });

        let replyText = '';
        for await (const chunk of responseStream) {
          replyText += chunk.text ?? '';
          setCurrentConversation(prev => {
            if (!prev?.messages) return prev;
            const newMessages = [...prev.messages];
            newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: replyText }] };
            return { ...prev, messages: newMessages, updatedAt: new Date() };
          });
        }

        const finalConversation: Conversation = {
          ...updatedConversation,
          messages: [...(updatedConversation.messages ?? []).slice(0, -1), { role: 'model', parts: [{ text: replyText }] }],
          updatedAt: new Date(),
        };

        setCurrentConversation(finalConversation);
        upsertConversation(finalConversation);
        incrementCount?.();
        return replyText;
      }

      const initialConversation: Conversation = {
        id: Date.now().toString(),
        title: text.slice(0, 20) || '수학 분석',
        userMessage: text,
        messages: [
          { role: 'user', parts: [{ text: '수학 문제 분석 요청' }] },
          { role: 'model', parts: [{ text: '' }] },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentConversation(initialConversation);

      const totalPrompt = `
너는 사용자가 입력한 수학 문제와 해설을 검증하고, 학생 수준에 맞춰 설명해준 뒤 후속 질문까지 뽑아주는 AI 수학 코치야.

[입력 데이터]
- 문제 정보: ${text}
- 참고 해설: ${solutionText}
- 학생 수준: ${schoolLevel}

[작업 지시]
1. 수학/학습과 무관하거나, 문제 정보가 부족하거나, 문제와 해설이 충돌하면 에러 메시지 한 줄만 출력하고 종료한다.
2. 선생님이 옆에서 설명하듯 자연스럽게 쓰되, 한 문단은 1~3문장으로 짧게 끊는다.
3. 중요한 이유, 판단 기준, 실수 포인트는 반드시 "→ "로 시작하는 강조 문장으로 작성한다.
4. 핵심 용어는 **굵게** 표시한다.
5. 검증 통과 시 아래 출력 형식만 사용한다. 전체 출력은 1200자 이내로 제한한다.

[출력 형식]
[해설본문]
[문제를 보고 가장 먼저 해야 할 일]
- 문제 유형을 어떻게 판단하는지 설명
→ 왜 그 판단이 중요한지 강조
[왜 이 방법을 선택할까?]
- 사용할 공식/도구를 고르는 이유 설명
→ 다른 방법보다 이 방법이 적절한 이유 강조
[이제 실제로 풀어봅시다]
- 단계별 풀이
[정답]
- 최종 답
[많이 막히는 이유]
- 자주 막히는 이유 3~4가지
[다음에 비슷한 문제를 만나면]
- 1단계, 2단계, 3단계 형태로 짧게
- 마지막 문장 끝에는 반드시 "암기보다 이유가 우선!"을 붙일 것
[추천질문]
1. 첫번째 꼬리질문 내용
2. 두번째 꼬리질문 내용
3. 세번째 꼬리질문 내용
`;

      const responseStream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: [{ role: 'user', parts: [{ text: totalPrompt }] }],
        config: {
          thinkingConfig: { thinkingLevel: 'low' },
        },
      });

      let totalResult = '';
      for await (const chunk of responseStream) {
        totalResult += chunk.text ?? '';
        const displayText = totalResult.includes('[추천질문]')
          ? totalResult.split('[추천질문]')[0].replace('[해설본문]', '').trim()
          : totalResult.replace('[해설본문]', '').trim();

        setCurrentConversation(prev => {
          if (!prev?.messages) return prev;
          const newMessages = [...prev.messages];
          newMessages[1] = { role: 'model', parts: [{ text: displayText }] };
          return { ...prev, messages: newMessages, updatedAt: new Date() };
        });
      }

      const [rawExplanation, rawFollowUps = ''] = totalResult.split('[추천질문]');
      const explanationContent = rawExplanation.replace('[해설본문]', '').trim();

      if (setFollowUps && rawFollowUps) {
        const questions = rawFollowUps
          .split('\n')
          .filter(line => /^\d+\./.test(line.trim()))
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(Boolean);

        if (questions.length > 0) setFollowUps(questions.slice(0, 3));
      }

      const finalConversation: Conversation = {
        ...initialConversation,
        messages: [initialConversation.messages![0], { role: 'model', parts: [{ text: explanationContent }] }],
        updatedAt: new Date(),
      };

      setCurrentConversation(finalConversation);
      upsertConversation(finalConversation);
      incrementCount?.();
      return explanationContent;
    } catch (error) {
      console.error('Gemini process error:', error);
      return '해설을 생성하는 데 실패했습니다. 다시 시도해 주세요.';
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversation?.id === id) setCurrentConversation(null);
  };

  const renameConversation = (id: string, newTitle: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle, updatedAt: new Date() } : c));
  };

  return (
    <ConversationContext.Provider value={{
      conversations,
      currentConversation,
      addConversation,
      sendMessageToGemini,
      deleteConversation,
      renameConversation,
      setCurrentConversation,
      isLoading,
    }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) throw new Error('useConversation must be used within a ConversationProvider');
  return context;
}
