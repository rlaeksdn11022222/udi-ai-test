import { useRef, useState } from 'react';
import { X } from 'lucide-react';

interface TextInputPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (problem: string, solution: string, schoolLevel: string) => void;
}

const SCHOOL_LEVELS = ['중1', '중2', '중3', '고1', '고2', '고3'];

export function TextInputPopup({ isOpen, onClose, onAnalyze }: TextInputPopupProps) {
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [schoolLevel, setSchoolLevel] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleAnalyze = () => {
    if ((problem.trim() || solution.trim()) && schoolLevel) {
      onAnalyze(problem, solution, schoolLevel);
      setProblem('');
      setSolution('');
      setSchoolLevel('');
      onClose();
    }
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-5 sm:p-8"
      onClick={handleClickOutside}
    >
      <div
        ref={modalRef}
        className="relative my-auto max-h-[calc(100vh-2.5rem)] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 sm:max-h-[calc(100vh-4rem)] sm:p-8"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 sm:right-6 sm:top-6"
          aria-label="닫기"
        >
          <X className="h-6 w-6 text-gray-600" />
        </button>

        <div className="mb-5 pr-10 sm:mb-6">
          <h2 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">
            문제와 해설 입력
          </h2>
          <p className="text-sm text-gray-600 sm:text-base">
            이해가 안 되는 문제와 해설을 텍스트로 입력하세요
          </p>
        </div>

        <div className="mb-5 sm:mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            학년 선택 <span className="text-red-500">*</span>
          </label>
          <select
            value={schoolLevel}
            onChange={(e) => setSchoolLevel(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-[#5C6BC0] focus:outline-none"
          >
            <option value="">학년을 선택하세요</option>
            {SCHOOL_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-5 sm:mb-8 sm:grid-cols-2 sm:gap-6">
          <div className="min-w-0">
            <label className="mb-2 block text-sm font-semibold text-gray-700 sm:mb-3">
              문제 입력
            </label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="문제를 입력하세요..."
              className="h-40 w-full resize-none rounded-2xl border-2 border-gray-200 px-4 py-3 text-base focus:border-[#5C6BC0] focus:outline-none sm:h-64 sm:px-5 sm:py-4"
            />
          </div>

          <div className="min-w-0">
            <label className="mb-2 block text-sm font-semibold text-gray-700 sm:mb-3">
              해설 입력
            </label>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="해설을 입력하세요..."
              className="h-40 w-full resize-none rounded-2xl border-2 border-gray-200 px-4 py-3 text-base focus:border-[#5C6BC0] focus:outline-none sm:h-64 sm:px-5 sm:py-4"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={(!problem.trim() && !solution.trim()) || !schoolLevel}
          className="w-full rounded-2xl bg-[#5C6BC0] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#5C6BC0]/30 transition-colors hover:bg-[#4E5BAD] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none sm:py-4 sm:text-lg"
        >
          분석하기
        </button>
        {!schoolLevel && (problem.trim() || solution.trim()) && (
          <p className="mt-2 text-center text-sm text-red-600">
            학년을 먼저 선택해주세요
          </p>
        )}
      </div>
    </div>
  );
}
