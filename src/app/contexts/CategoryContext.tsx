import { createContext, useContext, useState, ReactNode } from 'react';

export interface CategoryMastery {
  id: string;
  name: string;
  subcategory: string;
  masteryPercentage: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface CategoryContextType {
  categories: CategoryMastery[];
  updateMastery: (categoryId: string, correct: boolean) => void;
  getCategoryMastery: (categoryId: string) => CategoryMastery | undefined;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Mock initial categories based on user's learning history
const initialCategories: CategoryMastery[] = [
  {
    id: 'quadratic-formula',
    name: '이차방정식',
    subcategory: '근의 공식',
    masteryPercentage: 75,
    totalQuestions: 12,
    correctAnswers: 9
  },
  {
    id: 'quadratic-factoring',
    name: '이차방정식',
    subcategory: '인수분해',
    masteryPercentage: 60,
    totalQuestions: 10,
    correctAnswers: 6
  },
  {
    id: 'discriminant',
    name: '이차방정식',
    subcategory: '판별식',
    masteryPercentage: 85,
    totalQuestions: 8,
    correctAnswers: 7
  },
  {
    id: 'sqrt-basic',
    name: '제곱근',
    subcategory: '루트 기본 연산',
    masteryPercentage: 45,
    totalQuestions: 6,
    correctAnswers: 3
  },
  {
    id: 'sqrt-rationalize',
    name: '제곱근',
    subcategory: '분모의 유리화',
    masteryPercentage: 30,
    totalQuestions: 5,
    correctAnswers: 2
  },
  {
    id: 'sequence-general',
    name: '수열',
    subcategory: '일반항 구하기',
    masteryPercentage: 55,
    totalQuestions: 9,
    correctAnswers: 5
  },
  {
    id: 'sequence-recursive',
    name: '수열',
    subcategory: '점화식',
    masteryPercentage: 40,
    totalQuestions: 7,
    correctAnswers: 3
  },
  {
    id: 'polynomial-expansion',
    name: '다항식',
    subcategory: '전개와 인수분해',
    masteryPercentage: 70,
    totalQuestions: 10,
    correctAnswers: 7
  }
];

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryMastery[]>(initialCategories);

  const updateMastery = (categoryId: string, correct: boolean) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        const newTotal = cat.totalQuestions + 1;
        const newCorrect = cat.correctAnswers + (correct ? 1 : 0);
        return {
          ...cat,
          totalQuestions: newTotal,
          correctAnswers: newCorrect,
          masteryPercentage: Math.round((newCorrect / newTotal) * 100)
        };
      }
      return cat;
    }));
  };

  const getCategoryMastery = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  return (
    <CategoryContext.Provider value={{ categories, updateMastery, getCategoryMastery }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within CategoryProvider');
  }
  return context;
}
