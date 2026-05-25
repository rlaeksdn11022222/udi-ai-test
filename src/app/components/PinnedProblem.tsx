import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PinnedProblemProps {
  problemText: string;
  problemImage?: File | string;
  solutionImage?: File | string;
}

export function PinnedProblem({ problemText, problemImage, solutionImage }: PinnedProblemProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const problemImageUrl = useMemo(() => {
    if (!problemImage) return null;
    if (typeof problemImage === 'string') return problemImage;
    return URL.createObjectURL(problemImage);
  }, [problemImage]);

  const solutionImageUrl = useMemo(() => {
    if (!solutionImage) return null;
    if (typeof solutionImage === 'string') return solutionImage;
    return URL.createObjectURL(solutionImage);
  }, [solutionImage]);

  return (
    <div className="w-full max-w-full overflow-x-hidden border-b border-gray-200/50 bg-white shadow-sm">
      <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full min-w-0 items-center justify-between gap-3 text-left"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 text-sm font-semibold text-gray-700">문제</span>
            {!isExpanded && (
              <span className="truncate text-sm text-gray-500">
                {problemText}
              </span>
            )}
          </div>
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="mt-3 min-w-0 space-y-4 pb-1">
            {problemImageUrl ? (
              <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                <p className="mb-2 text-xs font-semibold text-gray-600">문제 이미지</p>
                <img src={problemImageUrl} alt="Problem" className="w-full rounded-lg" />
              </div>
            ) : (
              <div className="flex min-w-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-100 p-4 sm:p-6">
                <p className="text-sm text-gray-500">문제 사진이 없습니다</p>
              </div>
            )}

            <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 sm:px-4">
              <p className="mb-2 text-sm font-semibold text-gray-600">문제</p>
              <p className="break-words text-[15px] leading-7 text-gray-900 whitespace-pre-wrap sm:text-base">
                {problemText}
              </p>
            </div>

            {solutionImageUrl && (
              <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                <p className="mb-2 text-xs font-semibold text-gray-600">해설 이미지</p>
                <img src={solutionImageUrl} alt="Solution" className="w-full rounded-lg" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
