import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export type TrainingType = 'approach' | 'logic' | 'variation';

export interface RubricScores {
  relevance: number;
  logicalFlow: number;
  specificity: number;
}

export interface CategoryMastery {
  id: string;
  mainType: string;
  subType: string;
  typeLabel: string;
  overallAchievement: number;
  approachAccuracy: number;
  logicAccuracy: number;
  variationAccuracy: number;
  approachScores: RubricScores;
  logicScores: RubricScores;
  totalQuestions: number;
  correctAnswers: number;
  sourceProblem: string;
  sourceExplanation: string;
  weakPoints: string[];
}

interface CategoryContextType {
  categories: CategoryMastery[];
  updateMastery: (categoryId: string, correct: boolean, trainingType?: TrainingType) => void;
  saveAchievementResult: (categoryId: string, result: Partial<CategoryMastery>) => void;
  getCategoryMastery: (categoryId: string) => CategoryMastery | undefined;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getOverallAchievement(approach: number, logic: number, variation: number) {
  return clampPercent((approach + logic + variation) / 3);
}

const initialCategories: CategoryMastery[] = [
  {
    id: 'quadratic-discriminant',
    mainType: '이차방정식',
    subType: '판별식',
    typeLabel: '이차방정식-판별식',
    overallAchievement: 72,
    approachAccuracy: 80,
    logicAccuracy: 70,
    variationAccuracy: 66,
    approachScores: { relevance: 84, logicalFlow: 78, specificity: 76 },
    logicScores: { relevance: 72, logicalFlow: 70, specificity: 68 },
    totalQuestions: 9,
    correctAnswers: 7,
    sourceProblem: '이차방정식 x² - 4x + 3 = 0의 판별식을 구하고 근의 개수를 판단하세요.',
    sourceExplanation: '이차방정식 ax²+bx+c=0에서 판별식 D=b²-4ac를 계산해 D>0이면 서로 다른 두 실근, D=0이면 중근, D<0이면 실근이 없다고 판단합니다.',
    weakPoints: ['a, b, c를 먼저 분리하기', 'D의 부호로 근의 개수 판단하기'],
  },
  {
    id: 'quadratic-formula',
    mainType: '이차방정식',
    subType: '근의 공식',
    typeLabel: '이차방정식-근의 공식',
    overallAchievement: 64,
    approachAccuracy: 68,
    logicAccuracy: 61,
    variationAccuracy: 63,
    approachScores: { relevance: 70, logicalFlow: 64, specificity: 66 },
    logicScores: { relevance: 62, logicalFlow: 58, specificity: 63 },
    totalQuestions: 12,
    correctAnswers: 8,
    sourceProblem: '2x² + 5x - 3 = 0을 근의 공식으로 푸세요.',
    sourceExplanation: '인수분해가 바로 보이지 않으면 a, b, c를 찾아 근의 공식 x=(-b±√(b²-4ac))/2a에 대입합니다. 판별식과 부호 계산을 차례대로 확인해야 합니다.',
    weakPoints: ['공식 선택 이유 설명하기', '± 양쪽 값을 모두 계산하기', 'b의 부호 실수 줄이기'],
  },
  {
    id: 'sqrt-rationalize',
    mainType: '제곱근',
    subType: '분모의 유리화',
    typeLabel: '제곱근-분모의 유리화',
    overallAchievement: 55,
    approachAccuracy: 58,
    logicAccuracy: 52,
    variationAccuracy: 55,
    approachScores: { relevance: 60, logicalFlow: 54, specificity: 58 },
    logicScores: { relevance: 53, logicalFlow: 50, specificity: 54 },
    totalQuestions: 7,
    correctAnswers: 4,
    sourceProblem: '1/√3의 분모를 유리화하세요.',
    sourceExplanation: '분모에 제곱근이 있으면 분모와 분자에 같은 제곱근을 곱해 분모를 유리수로 만듭니다. 1/√3은 √3/3이 됩니다.',
    weakPoints: ['분자와 분모에 같은 값을 곱하기', '분모가 유리수가 되었는지 확인하기'],
  },
  {
    id: 'sequence-recursive',
    mainType: '수열',
    subType: '점화식',
    typeLabel: '수열-점화식',
    overallAchievement: 48,
    approachAccuracy: 50,
    logicAccuracy: 44,
    variationAccuracy: 50,
    approachScores: { relevance: 52, logicalFlow: 47, specificity: 50 },
    logicScores: { relevance: 46, logicalFlow: 42, specificity: 45 },
    totalQuestions: 6,
    correctAnswers: 3,
    sourceProblem: 'a₁=2, aₙ₊₁=aₙ+3일 때 a₄를 구하세요.',
    sourceExplanation: '점화식은 앞 항으로 다음 항을 만드는 규칙입니다. a₁에서 시작해 a₂, a₃, a₄를 순서대로 구하면 됩니다.',
    weakPoints: ['첫째항부터 차례대로 대입하기', 'n과 항 번호를 혼동하지 않기'],
  },
  {
    id: 'polynomial-factorization',
    mainType: '다항식',
    subType: '인수분해',
    typeLabel: '다항식-인수분해',
    overallAchievement: 69,
    approachAccuracy: 74,
    logicAccuracy: 66,
    variationAccuracy: 67,
    approachScores: { relevance: 75, logicalFlow: 70, specificity: 72 },
    logicScores: { relevance: 68, logicalFlow: 64, specificity: 66 },
    totalQuestions: 10,
    correctAnswers: 7,
    sourceProblem: 'x² + 5x + 6을 인수분해하세요.',
    sourceExplanation: '곱해서 6, 더해서 5가 되는 두 수 2와 3을 찾으면 x²+5x+6=(x+2)(x+3)입니다.',
    weakPoints: ['곱과 합 조건을 동시에 확인하기', '부호까지 함께 비교하기'],
  },
];

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryMastery[]>(initialCategories);

  const updateMastery = (categoryId: string, correct: boolean, trainingType: TrainingType = 'variation') => {
    setCategories(prev => prev.map(category => {
      if (category.id !== categoryId) return category;

      const totalQuestions = category.totalQuestions + 1;
      const correctAnswers = category.correctAnswers + (correct ? 1 : 0);
      const delta = correct ? 4 : -3;
      const nextApproach = trainingType === 'approach'
        ? clampPercent(category.approachAccuracy + delta)
        : category.approachAccuracy;
      const nextLogic = trainingType === 'logic'
        ? clampPercent(category.logicAccuracy + delta)
        : category.logicAccuracy;
      const nextVariation = trainingType === 'variation'
        ? clampPercent(category.variationAccuracy + delta)
        : category.variationAccuracy;

      return {
        ...category,
        totalQuestions,
        correctAnswers,
        approachAccuracy: nextApproach,
        logicAccuracy: nextLogic,
        variationAccuracy: nextVariation,
        overallAchievement: getOverallAchievement(nextApproach, nextLogic, nextVariation),
      };
    }));
  };

  const saveAchievementResult = (categoryId: string, result: Partial<CategoryMastery>) => {
    setCategories(prev => prev.map(category => {
      if (category.id !== categoryId) return category;

      const approachAccuracy = clampPercent(result.approachAccuracy ?? category.approachAccuracy);
      const logicAccuracy = clampPercent(result.logicAccuracy ?? category.logicAccuracy);
      const variationAccuracy = clampPercent(result.variationAccuracy ?? category.variationAccuracy);
      const mainType = result.mainType ?? category.mainType;
      const subType = result.subType ?? category.subType;

      return {
        ...category,
        ...result,
        mainType,
        subType,
        typeLabel: `${mainType}-${subType}`,
        approachAccuracy,
        logicAccuracy,
        variationAccuracy,
        overallAchievement: getOverallAchievement(approachAccuracy, logicAccuracy, variationAccuracy),
      };
    }));
  };

  const getCategoryMastery = (categoryId: string) => {
    return categories.find(category => category.id === categoryId);
  };

  const value = useMemo(() => ({
    categories,
    updateMastery,
    saveAchievementResult,
    getCategoryMastery,
  }), [categories]);

  return (
    <CategoryContext.Provider value={value}>
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
