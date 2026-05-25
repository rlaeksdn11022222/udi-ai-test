import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useCategory } from '../contexts/CategoryContext';
import { Sidebar, MobileMenuButton } from './Sidebar';

export function CategoryDashboard() {
  const navigate = useNavigate();
  const { categories } = useCategory();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.name]) acc[cat.name] = [];
    acc[cat.name].push(cat);
    return acc;
  }, {} as Record<string, typeof categories>);

  const getMasteryColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getMasteryBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F9F9F8]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200/50 bg-white px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <MobileMenuButton onClick={() => setIsSidebarOpen(true)} />
          <button
            onClick={() => navigate('/')}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">유형 학습하기</h1>
        </div>
      </header>

      <div className="flex min-w-0 flex-1 items-stretch">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <h2 className="mb-3 text-2xl font-bold text-gray-900">
                AI가 분석한 나의 학습 현황
              </h2>
              <p className="text-base leading-relaxed text-gray-600">
                지금까지 풀어본 문제를 바탕으로 유형별 이해도를 계산했어요.
                취약한 유형을 집중적으로 연습하면 실력이 더 빠르게 향상됩니다.
              </p>
            </section>

            <div className="space-y-6">
              {Object.entries(groupedCategories).map(([mainCategory, subcategories]) => (
                <section key={mainCategory} className="space-y-3">
                  <h3 className="px-2 text-lg font-bold text-gray-900">
                    {mainCategory}
                  </h3>

                  <div className="grid gap-3">
                    {subcategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => navigate(`/category/${category.id}`)}
                        className="group rounded-xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-[#5C6BC0] hover:shadow-md"
                      >
                        <div className="mb-3 flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="mb-1 text-base font-semibold text-gray-900">
                              {category.subcategory}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {category.totalQuestions}문제 풀이완료 · {category.correctAnswers}개 정답
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">
                            <div className={`rounded-full border-2 px-4 py-2 text-lg font-bold ${getMasteryColor(category.masteryPercentage)}`}>
                              {category.masteryPercentage}%
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-[#5C6BC0]" />
                          </div>
                        </div>

                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full ${getMasteryBarColor(category.masteryPercentage)} transition-all`}
                            style={{ width: `${category.masteryPercentage}%` }}
                          />
                        </div>
                      </button>
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
