import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Upload, X, BookOpen } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useConversation } from "../contexts/ConversationContext";
import { useUsageLimit } from "../contexts/UsageLimitContext"; // 1. 사용량 제한 훅 추가
import { LoginButton } from "./LoginButton";
import { UserProfile } from "./UserProfile";
import { TextInputPopup } from "./TextInputPopup";
import { PaywallPopup } from "./PaywallPopup"; // 2. 페이월 팝업 컴포넌트 추가

const quickStartPrompts = [
  "√ 루트 문제 이해가 안 돼요",
  "이차방정식 풀이를 모르겠어요",
  "수열 점화식이 뭔가요?",
];

function generateConversationTitle(message: string): string {
  if (message.includes("이차방정식")) return "이차방정식 풀이";
  if (message.includes("루트") || message.includes("√"))
    return "루트 계산 방법";
  if (message.includes("수열")) return "수열 점화식";
  if (message.includes("판별식")) return "판별식 이해하기";
  if (message.includes("인수분해"))
    return "인수분해 vs 근의 공식";

  const words = message.split(" ").slice(0, 3).join(" ");
  return words.length > 20
    ? words.substring(0, 20) + "..."
    : words;
}

export function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addConversation } = useConversation();
  
  // UsageLimitContext에서 필요한 한도 상태와 카운트 증가 함수 가져오기
  const { canUseExplanation, incrementExplanation } = useUsageLimit();

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false); // 3. 페이월 오프너 상태 추가

  const [problemImage, setProblemImage] = useState<File | null>(null);
  const [solutionImage, setSolutionImage] = useState<File | null>(null);
  const [problemPreview, setProblemPreview] = useState<string | null>(null);
  const [solutionPreview, setSolutionPreview] = useState<string | null>(null);
  const [imageSchoolLevel, setImageSchoolLevel] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // 공통 한도 체크 함수
  const checkLimitAndProceed = (proceedCallback: () => void) => {
    if (!canUseExplanation) {
      setIsPaywallOpen(true); // 6회 다 썼으면 페이월 모달 오픈!
      return;
    }
    
    // 카운트 1 올리고 정상 진행
    incrementExplanation();
    proceedCallback();
  };

  const handleTextAnalyze = (problem: string, solution: string, schoolLevel: string) => {
    const message = problem || solution || "입력한 문제를 분석해주세요";

    checkLimitAndProceed(() => {
      if (isAuthenticated) {
        const conversation = {
          id: Date.now().toString(),
          title: generateConversationTitle(message),
          userMessage: message,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addConversation(conversation);
      }

      navigate("/response", {
        state: { userMessage: message, problemText: problem, solutionText: solution, schoolLevel },
      });
    });
  };

  const handleQuickStart = (text: string) => {
    checkLimitAndProceed(() => {
      if (isAuthenticated) {
        const conversation = {
          id: Date.now().toString(),
          title: generateConversationTitle(text),
          userMessage: text,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addConversation(conversation);
      }
      navigate("/response", { state: { userMessage: text } });
    });
  };

  const handleProblemUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProblemImage(file);
      setProblemPreview(URL.createObjectURL(file));
    }
  };

  const handleSolutionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSolutionImage(file);
      setSolutionPreview(URL.createObjectURL(file));
    }
  };

  const handleAnalyze = () => {
    if (problemImage && solutionImage && imageSchoolLevel) {
      const message = "업로드한 이미지의 문제를 분석해주세요";

      checkLimitAndProceed(() => {
        if (isAuthenticated) {
          const conversation = {
            id: Date.now().toString(),
            title: "이미지 문제 분석",
            userMessage: message,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          addConversation(conversation);
        }

        navigate("/response", {
          state: {
            userMessage: message,
            problemImage,
            solutionImage,
            schoolLevel: imageSchoolLevel,
          },
        });

        // 상태 초기화 및 창 닫기
        setProblemImage(null);
        setSolutionImage(null);
        setProblemPreview(null);
        setSolutionPreview(null);
        setImageSchoolLevel('');
        setIsImageModalOpen(false);
      });
    }
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-gray-200/50 px-4 sm:px-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/category-dashboard')}
          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#5C6BC0] rounded-full transition-colors flex items-center gap-2 font-medium text-sm"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">유형학습하기</span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#5C6BC0] rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-lg">U</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 hidden sm:inline">UDI AI</span>
        </div>

        <div>
          {isAuthenticated ? <UserProfile /> : <LoginButton />}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-[680px] space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-[30px] font-bold text-gray-900 leading-tight">
              어떤 문제가 이해 안 되나요?
            </h1>
            <p className="text-base text-gray-500">
              문제와 해설을 붙여넣거나 사진을 올려주세요
            </p>
          </div>

          {/* Input Bar */}
          <div className="relative">
            <div
              onClick={() => setIsTextModalOpen(true)}
              className="w-full h-14 px-6 bg-white border border-gray-200 rounded-full text-base text-gray-400 flex items-center cursor-pointer hover:border-[#5C6BC0] transition-colors"
            >
              문제 또는 해설을 입력하세요...
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageModalOpen(true);
                }}
                className="w-10 h-10 bg-[#5C6BC0] rounded-full flex items-center justify-center hover:bg-[#4E5BAD] transition-colors"
              >
                <Upload className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Quick Start Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            {quickStartPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickStart(prompt)}
                className="px-5 py-2.5 border-2 border-[#5C6BC0] text-[#5C6BC0] rounded-full hover:bg-[#5C6BC0] hover:text-white transition-colors text-sm font-medium"
              >
                {prompt}
              </button>
            ))}
            <button
              onClick={() => setIsTextModalOpen(true)}
              className="px-5 py-2.5 border-2 border-[#5C6BC0] text-[#5C6BC0] rounded-full hover:bg-[#5C6BC0] hover:text-white transition-colors text-sm font-medium"
            >
              직접 입력하기
            </button>
          </div>
        </div>
      </main>

      {/* Text Input Popup */}
      <TextInputPopup
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        onAnalyze={handleTextAnalyze}
      />

      {/* Image Upload Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
          onClick={handleClickOutside}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-3xl p-8 max-w-4xl w-full relative"
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">이미지 업로드</h2>
              <p className="text-base text-gray-600">
                문제 이미지와 해설 이미지를 모두 업로드해주세요
              </p>
            </div>

            {/* School Level Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                학년 선택 <span className="text-red-500">*</span>
              </label>
              <select
                value={imageSchoolLevel}
                onChange={(e) => setImageSchoolLevel(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#5C6BC0] focus:outline-none text-base"
              >
                <option value="">학년을 선택하세요</option>
                <option value="중1">중1</option>
                <option value="중2">중2</option>
                <option value="중3">중3</option>
                <option value="고1">고1</option>
                <option value="고2">고2</option>
                <option value="고3">고3</option>
              </select>
            </div>

            {/* Upload Boxes */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">문제 이미지</label>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleProblemUpload} className="hidden" />
                  <div className="aspect-[4/5] border-2 border-dashed border-gray-300 rounded-2xl hover:border-[#5C6BC0] transition-colors flex items-center justify-center overflow-hidden bg-gray-50">
                    {problemPreview ? (
                      <img src={problemPreview} alt="Problem preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-6">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600">클릭하여 업로드</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG (최대 10MB)</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">해설 이미지</label>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleSolutionUpload} className="hidden" />
                  <div className="aspect-[4/5] border-2 border-dashed border-gray-300 rounded-2xl hover:border-[#5C6BC0] transition-colors flex items-center justify-center overflow-hidden bg-gray-50">
                    {solutionPreview ? (
                      <img src={solutionPreview} alt="Solution preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-6">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600">클릭하여 업로드</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG (최대 10MB)</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!problemImage || !solutionImage || !imageSchoolLevel}
              className="w-full px-8 py-4 bg-[#5C6BC0] hover:bg-[#4E5BAD] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-2xl transition-colors shadow-lg shadow-[#5C6BC0]/30 disabled:shadow-none"
            >
              분석하기
            </button>
          </div>
        </div>
      )}

      {/* 4. 결제 유도 페이월 팝업 장착 */}
      <PaywallPopup 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)} 
        limitType="explanation" 
      />
    </div>
  );
}