import { useNavigate } from 'react-router';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useCategory } from '../contexts/CategoryContext';
import { Sidebar, MobileMenuButton } from './Sidebar';
import { useState } from 'react';

export function CategoryDashboard() {
  const navigate = useNavigate();
  const { categories } = useCategory();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Group categories by main category
  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.name]) {
      acc[cat.name] = [];
    }
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
    <div className="min-h-screen flex flex-col bg-[#F9F9F8]">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200/50 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <MobileMenuButton onClick={() => setIsSidebarOpen(true)} />
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">유형 학습하기</h1>
        </div>
      </header>

      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Intro Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 mb-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                AI가 분석한 나의 학습 현황
              </h2>
              <p className="text-base text-gray-600 leading-relaxed">
                지금까지 풀어본 문제들을 AI가 자동으로 분석하여 유형별 이해도를 계산했어요.
                취약한 유형을 집중적으로 연습하면 실력이 빠르게 향상됩니다!
              </p>
            </div>

            {/* Category Groups */}
            <div className="space-y-6">
              {Object.entries(groupedCategories).map(([mainCategory, subcategories]) => (
                <div key={mainCategory} className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 px-2">
                    {mainCategory}
                  </h3>

                  <div className="grid gap-3">
                    {subcategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => navigate(`/category/${category.id}`)}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#5C6BC0] hover:shadow-md transition-all group text-left"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-base mb-1">
                              {category.subcategory}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {category.totalQuestions}문제 풀이완료 • {category.correctAnswers}개 정답
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className={`px-4 py-2 rounded-full border-2 font-bold text-lg ${getMasteryColor(category.masteryPercentage)}`}>
                              {category.masteryPercentage}%
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#5C6BC0] transition-colors" />
                          </div>
                        </div>

                        {/* Mastery Progress Bar */}
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getMasteryBarColor(category.masteryPercentage)} transition-all`}
                            style={{ width: `${category.masteryPercentage}%` }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
