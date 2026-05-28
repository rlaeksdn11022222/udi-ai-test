import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ChevronRight, History, LineChart, PenLine } from 'lucide-react';
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

function CategoryCard({ category }: { category: CategoryMastery }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/category/${category.id}`)}
      className="group w-full rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-[#5C6BC0] hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-semibold text-[#5C6BC0]">{category.mainType}</p>
          <h4 className="truncate text-xl font-bold text-gray-950">{category.typeLabel}</h4>
          <p className="mt-2 text-sm text-gray-600">
            누적 {category.totalQuestions}문제 · 정답 {category.correctAnswers}개
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

  const averageAchievement = categories.length > 0
    ? Math.round(categories.reduce((sum, category) => sum + category.overallAchievement, 0) / categories.length)
    : 0;

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
          <div className="mx-auto max-w-4xl">
            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5C6BC0]">
                    <LineChart className="h-4 w-4" />
                    <span>내가 푼 데이터로 쌓이는 유형</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                    저장된 유형
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-600">
                    해설을 보고 AI 코치 훈련까지 완료한 문제만 유형으로 저장돼요. 같은 유형을 반복할수록 성취도가 계속 업데이트됩니다.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-[#F9F9F8] p-4 sm:min-w-[150px]">
                  <p className="text-sm text-gray-500">평균 성취도</p>
                  <p className="mt-1 text-3xl font-bold text-gray-950">{averageAchievement}%</p>
                </div>
              </div>
            </section>

            {categories.length === 0 ? (
              <section className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
                <History className="mx-auto mb-4 h-8 w-8 text-[#5C6BC0]" />
                <h3 className="text-xl font-bold text-gray-950">아직 푼 문제 기록이 없어요</h3>
                <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-gray-600">
                  문제를 풀고 AI 코치 훈련까지 완료하면, 그 기록을 바탕으로 유형과 성취도가 자동으로 쌓입니다.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-6 rounded-full bg-[#5C6BC0] px-6 py-3 font-medium text-white transition-colors hover:bg-[#4E5BAD]"
                >
                  문제 풀러 가기
                </button>
              </section>
            ) : (
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
