import { useState, useRef } from 'react';
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClickOutside}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl p-8 max-w-4xl w-full relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            문제와 해설 입력
          </h2>
          <p className="text-base text-gray-600">
            이해가 안 되는 문제와 해설을 텍스트로 입력하세요
          </p>
        </div>

        {/* School Level Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            학년 선택 <span className="text-red-500">*</span>
          </label>
          <select
            value={schoolLevel}
            onChange={(e) => setSchoolLevel(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#5C6BC0] focus:outline-none text-base"
          >
            <option value="">학년을 선택하세요</option>
            {SCHOOL_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* Input Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Problem Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              문제 입력
            </label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="문제를 입력하세요..."
              className="w-full h-64 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#5C6BC0] focus:outline-none resize-none text-base"
            />
          </div>

          {/* Solution Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              해설 입력
            </label>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="해설을 입력하세요..."
              className="w-full h-64 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#5C6BC0] focus:outline-none resize-none text-base"
            />
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={(!problem.trim() && !solution.trim()) || !schoolLevel}
          className="w-full px-8 py-4 bg-[#5C6BC0] hover:bg-[#4E5BAD] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-2xl transition-colors shadow-lg shadow-[#5C6BC0]/30 disabled:shadow-none"
        >
          분석하기
        </button>
        {!schoolLevel && (problem.trim() || solution.trim()) && (
          <p className="text-center text-sm text-red-600 mt-2">
            학년을 먼저 선택해주세요
          </p>
        )}
      </div>
    </div>
  );
}
