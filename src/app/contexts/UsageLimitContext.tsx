import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UsageLimitContextType {
  explanationCount: number;
  followUpCount: number;
  canUseExplanation: boolean;
  canUseFollowUp: boolean;
  incrementExplanation: () => boolean;
  incrementFollowUp: () => boolean;
  resetLimits: () => void;
}

const EXPLANATION_LIMIT = 6;
const FOLLOWUP_LIMIT = 20;

const UsageLimitContext = createContext<UsageLimitContextType | undefined>(undefined);

export function UsageLimitProvider({ children }: { children: ReactNode }) {
  const [explanationCount, setExplanationCount] = useState(0);
  const [followUpCount, setFollowUpCount] = useState(0);

  // Load counts from localStorage on mount
  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('usageDate');

    if (savedDate === today) {
      const savedExplanation = localStorage.getItem('explanationCount');
      const savedFollowUp = localStorage.getItem('followUpCount');

      if (savedExplanation) setExplanationCount(parseInt(savedExplanation));
      if (savedFollowUp) setFollowUpCount(parseInt(savedFollowUp));
    } else {
      // New day, reset counts
      localStorage.setItem('usageDate', today);
      localStorage.setItem('explanationCount', '0');
      localStorage.setItem('followUpCount', '0');
    }
  }, []);

  const incrementExplanation = (): boolean => {
    if (explanationCount >= EXPLANATION_LIMIT) {
      return false;
    }
    const newCount = explanationCount + 1;
    setExplanationCount(newCount);
    localStorage.setItem('explanationCount', newCount.toString());
    return true;
  };

  const incrementFollowUp = (): boolean => {
    if (followUpCount >= FOLLOWUP_LIMIT) {
      return false;
    }
    const newCount = followUpCount + 1;
    setFollowUpCount(newCount);
    localStorage.setItem('followUpCount', newCount.toString());
    return true;
  };

  const resetLimits = () => {
    setExplanationCount(0);
    setFollowUpCount(0);
    localStorage.setItem('explanationCount', '0');
    localStorage.setItem('followUpCount', '0');
  };

  return (
    <UsageLimitContext.Provider value={{
      explanationCount,
      followUpCount,
      canUseExplanation: explanationCount < EXPLANATION_LIMIT,
      canUseFollowUp: followUpCount < FOLLOWUP_LIMIT,
      incrementExplanation,
      incrementFollowUp,
      resetLimits
    }}>
      {children}
    </UsageLimitContext.Provider>
  );
}

export function useUsageLimit() {
  const context = useContext(UsageLimitContext);
  if (!context) {
    throw new Error('useUsageLimit must be used within UsageLimitProvider');
  }
  return context;
}
