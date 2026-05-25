import { X, Zap } from 'lucide-react';

interface PaywallPopupProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'explanation' | 'followup';
}

export function PaywallPopup({ isOpen, onClose, limitType }: PaywallPopupProps) {
  if (!isOpen) return null;

  const handleUpgrade = () => {
    // In production, this would redirect to payment page
    alert('결제 페이지로 이동합니다');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            오늘의 무료 사용량을 모두 사용했어요
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            {limitType === 'explanation' ? (
              <>
                오늘 <strong>6개의 문제 분석</strong>을 모두 사용하셨습니다.<br />
                계속 학습하시려면 프리미엄으로 업그레이드하세요.
              </>
            ) : (
              <>
                오늘 <strong>20개의 추가 질문</strong>을 모두 사용하셨습니다.<br />
                계속 학습하시려면 프리미엄으로 업그레이드하세요.
              </>
            )}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Premium Benefits */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
            <h3 className="font-bold text-indigo-900 mb-4">프리미엄으로 더 많이 학습하세요</h3>
            <ul className="space-y-3 text-sm text-indigo-900">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <span>무제한 문제 분석 및 해설</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <span>무제한 AI 코치 훈련</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <span>유형별 약점 분석 리포트</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                <span>학습 기록 영구 저장</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Upgrade Button */}
        <button
          onClick={handleUpgrade}
          className="w-full px-6 py-4 bg-gradient-to-r from-[#5C6BC0] to-purple-600 hover:from-[#4E5BAD] hover:to-purple-700 text-white text-lg font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl"
        >
          프리미엄 시작하기
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          내일 0시에 무료 사용량이 초기화됩니다
        </p>
      </div>
    </div>
  );
}
