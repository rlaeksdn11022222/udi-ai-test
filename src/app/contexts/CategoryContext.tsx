import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

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
  updatedAt: string;
}

interface TrainingResultInput {
  problem: string;
  explanation: string;
  correctCount: number;
  totalCount: number;
  missedPoints: string[];
}

interface CategoryContextType {
  categories: CategoryMastery[];
  updateMastery: (categoryId: string, correct: boolean, trainingType?: TrainingType) => void;
  recordTrainingResult: (result: TrainingResultInput) => void;
  getCategoryMastery: (categoryId: string) => CategoryMastery | undefined;
}

const STORAGE_KEY = 'udi-category-mastery-v3';
const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getOverallAchievement(approach: number, logic: number, variation: number) {
  return clampPercent((approach + logic + variation) / 3);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function inferType(problem: string, explanation: string) {
  const text = `${problem} ${explanation}`;

  if (/판별식|D\s*=|b²|b\^2|근의\s*개수/.test(text)) {
    return { mainType: '이차방정식', subType: '판별식' };
  }
  if (/근의\s*공식|x\s*=\s*\(-?b|±|플러스마이너스/.test(text)) {
    return { mainType: '이차방정식', subType: '근의 공식' };
  }
  if (/인수분해|\(x|곱해서|더해서/.test(text)) {
    return { mainType: '다항식', subType: '인수분해' };
  }
  if (/제곱근|루트|√|유리화/.test(text)) {
    return { mainType: '제곱근', subType: text.includes('유리화') ? '분모의 유리화' : '제곱근 계산' };
  }
  if (/수열|점화식|aₙ|an|일반항/.test(text)) {
    return { mainType: '수열', subType: text.includes('점화') ? '점화식' : '일반항' };
  }
  if (/일차방정식|연립방정식/.test(text)) {
    return { mainType: '방정식', subType: text.includes('연립') ? '연립방정식' : '일차방정식' };
  }

  return { mainType: '수학', subType: '문제 해석' };
}

function makeBaseScores(correctCount: number, totalCount: number, missedPoints: string[]) {
  const accuracy = totalCount > 0 ? clampPercent((correctCount / totalCount) * 100) : 0;
  const missPenalty = Math.min(18, missedPoints.length * 3);

  const approachAccuracy = clampPercent(accuracy - Math.round(missPenalty * 0.4));
  const logicAccuracy = clampPercent(accuracy - Math.round(missPenalty * 0.6));
  const variationAccuracy = accuracy;

  return {
    approachAccuracy,
    logicAccuracy,
    variationAccuracy,
    approachScores: {
      relevance: clampPercent(approachAccuracy + 4),
      logicalFlow: clampPercent(approachAccuracy - 2),
      specificity: clampPercent(approachAccuracy - 4),
    },
    logicScores: {
      relevance: clampPercent(logicAccuracy + 2),
      logicalFlow: clampPercent(logicAccuracy),
      specificity: clampPercent(logicAccuracy - 3),
    },
  };
}

function mergePercent(oldValue: number, oldTotal: number, newValue: number, newTotal: number) {
  const total = Math.max(oldTotal + newTotal, 1);
  return clampPercent(((oldValue * oldTotal) + (newValue * newTotal)) / total);
}

function isCategoryList(value: unknown): value is CategoryMastery[] {
  return Array.isArray(value) && value.every(item => {
    const category = item as CategoryMastery;
    return typeof category.id === 'string' &&
      typeof category.typeLabel === 'string' &&
      typeof category.overallAchievement === 'number';
  });
}

function loadInitialCategories() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return isCategoryList(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryMastery[]>(loadInitialCategories);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  const updateMastery = (categoryId: string, correct: boolean, trainingType: TrainingType = 'variation') => {
    setCategories(prev => prev.map(category => {
      if (category.id !== categoryId) return category;

      const totalQuestions = category.totalQuestions + 1;
      const correctAnswers = category.correctAnswers + (correct ? 1 : 0);
      const delta = correct ? 4 : -5;
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
        updatedAt: new Date().toISOString(),
      };
    }));
  };

  const recordTrainingResult = (result: TrainingResultInput) => {
    const { mainType, subType } = inferType(result.problem, result.explanation);
    const typeLabel = `${mainType}-${subType}`;
    const id = slugify(typeLabel);
    const scores = makeBaseScores(result.correctCount, result.totalCount, result.missedPoints);
    const now = new Date().toISOString();

    setCategories(prev => {
      const existing = prev.find(category => category.id === id);

      if (!existing) {
        const newCategory: CategoryMastery = {
          id,
          mainType,
          subType,
          typeLabel,
          overallAchievement: getOverallAchievement(
            scores.approachAccuracy,
            scores.logicAccuracy,
            scores.variationAccuracy,
          ),
          ...scores,
          totalQuestions: result.totalCount,
          correctAnswers: result.correctCount,
          sourceProblem: result.problem,
          sourceExplanation: result.explanation,
          weakPoints: [...new Set(result.missedPoints)].slice(0, 6),
          updatedAt: now,
        };

        return [newCategory, ...prev];
      }

      return prev.map(category => {
        if (category.id !== id) return category;

        const totalQuestions = category.totalQuestions + result.totalCount;
        const correctAnswers = category.correctAnswers + result.correctCount;
        const approachAccuracy = mergePercent(
          category.approachAccuracy,
          category.totalQuestions,
          scores.approachAccuracy,
          result.totalCount,
        );
        const logicAccuracy = mergePercent(
          category.logicAccuracy,
          category.totalQuestions,
          scores.logicAccuracy,
          result.totalCount,
        );
        const variationAccuracy = mergePercent(
          category.variationAccuracy,
          category.totalQuestions,
          scores.variationAccuracy,
          result.totalCount,
        );

        return {
          ...category,
          totalQuestions,
          correctAnswers,
          approachAccuracy,
          logicAccuracy,
          variationAccuracy,
          approachScores: scores.approachScores,
          logicScores: scores.logicScores,
          overallAchievement: getOverallAchievement(approachAccuracy, logicAccuracy, variationAccuracy),
          sourceProblem: result.problem || category.sourceProblem,
          sourceExplanation: result.explanation || category.sourceExplanation,
          weakPoints: [...new Set([...result.missedPoints, ...category.weakPoints])].slice(0, 6),
          updatedAt: now,
        };
      });
    });
  };

  const getCategoryMastery = (categoryId: string) => {
    return categories.find(category => category.id === categoryId);
  };

  const value = useMemo(() => ({
    categories,
    updateMastery,
    recordTrainingResult,
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
