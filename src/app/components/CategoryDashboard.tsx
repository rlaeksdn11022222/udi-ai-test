import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, BarChart3, Brain, ChevronRight, PenLine, Repeat2, Target } from 'lucide-react';
import { CategoryMastery, useCategory } from '../contexts/CategoryContext';
import { Sidebar, MobileMenuButton } from './Sidebar';

function getAchievementTone(percentage: number) {
  if (percentage >= 80) return 'border-green-200 bg-green-50 text-green-700';
  if (percentage >= 60) return 'border-blue-200 bg-blue-50 text-blue-700';
  if (percentage >= 40) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-red-200 bg-red-50 text-red-700';
}

function getBarColor(percentage: number) {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="min-w-0 text-gray-600">{label}</span>
      <span className="shrink-0 font-semibold text-gray-900">{value}%</span>
    </div>
  );
}

function TrainingScorePill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <strong className="text-2xl text-gray-950">{value}%</strong>
        <span className="pb-1 text-xs text-gray-500">정답률</span>
      </div>
    </div>
  );
}

function CategoryCard({ category }: { category: CategoryMastery }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/category/${category.id}`)}
      className="group w-full rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-[#5C6BC0] hover:shadow-md"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-semibold text-[#5C6BC0]">{category.typeLabel}</p>
          <h4 className="text-xl font-bold text-gray-950">{category.subType}</h4>
          <p className="mt-2 text-sm text-gray-600">
            {category.totalQuestions}문제 풀이완료 · {category.correctAnswers}개 정답
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className={`rounded-full border-2 px-4 py-2 text-lg font-bold ${getAchievementTone(category.overallAchievement)}`}>
            {category.overallAchievement}%
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-[#5C6BC0]" />
        </div>
      </div>

      <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full ${getBarColor(category.overallAchievement)} transition-all`}
          style={{ width: `${category.overallAchievement}%` }}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <TrainingScorePill
          icon={<Target className="h-4 w-4 text-[#5C6BC0]" />}
          label="접근방식유형"
          value={category.approachAccuracy}
        />
        <TrainingScorePill
          icon={<Brain className="h-4 w-4 text-[#5C6BC0]" />}
          label="논리적사고유형"
          value={category.logicAccuracy}
        />
        <TrainingScorePill
          icon={<Repeat2 className="h-4 w-4 text-[#5C6BC0]" />}
          label="문제변형유형"
          value={category.variationAccuracy}
        />
      </div>

      <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
        <div>
          <h5 className="mb-2 text-sm font-bold text-gray-900">접근방식유형 세부 평가</h5>
          <div className="space-y-1.5">
            <ScoreRow label="적절성" value={category.approachScores.relevance} />
            <ScoreRow label="논리적흐름" value={category.approachScores.logicalFlow} />
            <ScoreRow label="구체적서술" value={category.approachScores.specificity} />
          </div>
        </div>
        <div>
          <h5 className="mb-2 text-sm font-bold text-gray-900">논리적사고유형 세부 평가</h5>
          <div className="space-y-1.5">
            <ScoreRow label="적절성" value={category.logicScores.relevance} />
            <ScoreRow label="논리적흐름" value={category.logicScores.logicalFlow} />
            <ScoreRow label="구체적서술" value={category.logicScores.specificity} />
          </div>
        </div>
      </div>
    </button>
  );
}

export function CategoryDashboard() {
  const navigate = useNavigate();
  const { categories } = useCategory();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const groupedCategories = useMemo(() => {
    return categories.reduce((acc, category) => {
      if (!acc[category.mainType]) acc[category.mainType] = [];
      acc[category.mainType].push(category);
      return acc;
    }, {} as Record<string, CategoryMastery[]>);
  }, [categories]);

  const averageAchievement = Math.round(
    categories.reduce((sum, category) => sum + category.overallAchievement, 0) / Math.max(categories.length, 1),
  );
  const weakestCategory = [...categories].sort((a, b) => a.overallAchievement - b.overallAchievement)[0];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F9F9F8]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200/50 bg-white px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <MobileMenuButton onClick={() => setIsSidebarOpen(true)} />
          <button
            onClick={() => navigate('/')}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="처음 화면으로 가기"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">유형 학습하기</h1>
        </div>
      </header>

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

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5C6BC0]">
                    <BarChart3 className="h-4 w-4" />
                    <span>유형저장결과 기반 학습 현황</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                    AI가 분석한 나의 유형별 성취도
                  </h2>
                  <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-600">
                    문제를 푼 결과를 큰범위-작은범위 형식으로 저장하고, 접근방식유형 · 논리적사고유형 · 문제변형유형의 평균으로 전체 성취도를 계산했어요.
                  </p>
                </div>

                <div className="grid shrink-0 grid-cols-2 gap-3 sm:min-w-[320px]">
                  <div className="rounded-xl border border-gray-200 bg-[#F9F9F8] p-4">
                    <p className="text-sm text-gray-500">평균 성취도</p>
                    <p className="mt-1 text-3xl font-bold text-gray-950">{averageAchievement}%</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-[#F9F9F8] p-4">
                    <p className="text-sm text-gray-500">우선 훈련</p>
                    <p className="mt-1 truncate text-lg font-bold text-gray-950">
                      {weakestCategory?.typeLabel ?? '없음'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="space-y-8">
              {Object.entries(groupedCategories).map(([mainCategory, subcategories]) => (
                <section key={mainCategory} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <PenLine className="h-5 w-5 text-[#5C6BC0]" />
                    <h3 className="text-xl font-bold text-gray-950">{mainCategory}</h3>
                  </div>

                  <div className="grid gap-4">
                    {subcategories.map(category => (
                      <CategoryCard key={category.id} category={category} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
