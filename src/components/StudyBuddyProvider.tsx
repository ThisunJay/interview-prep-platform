"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const DEFAULT_STUDY_TOPICS = [
  "AWS Fundamentals",
  "Java",
  "Spring Boot",
  "React",
] as const;

type StudyBuddyContextValue = {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  topicOptions: string[];
  setTopicOptions: (topics: string[]) => void;
};

const StudyBuddyContext = createContext<StudyBuddyContextValue | null>(null);

const STORAGE_KEY = "prep.activeStudyCategory";

export function StudyBuddyProvider({ children }: { children: ReactNode }) {
  const [activeCategory, setActiveCategoryState] = useState<string>(
    DEFAULT_STUDY_TOPICS[0]
  );
  const [topicOptions, setTopicOptions] = useState<string[]>([
    ...DEFAULT_STUDY_TOPICS,
  ]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved?.trim()) setActiveCategoryState(saved.trim());
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const setActiveCategory = useCallback((category: string) => {
    const next = category.trim();
    if (!next) return;
    setActiveCategoryState(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const mergeTopicOptions = useCallback((topics: string[]) => {
    setTopicOptions((prev) => {
      const merged = [...DEFAULT_STUDY_TOPICS, ...prev, ...topics]
        .map((t) => t.trim())
        .filter(Boolean);
      return Array.from(new Set(merged));
    });
  }, []);

  const value = useMemo(
    () => ({
      activeCategory: hydrated ? activeCategory : DEFAULT_STUDY_TOPICS[0],
      setActiveCategory,
      topicOptions,
      setTopicOptions: mergeTopicOptions,
    }),
    [activeCategory, hydrated, mergeTopicOptions, setActiveCategory, topicOptions]
  );

  return (
    <StudyBuddyContext.Provider value={value}>
      {children}
    </StudyBuddyContext.Provider>
  );
}

export function useStudyBuddy() {
  const ctx = useContext(StudyBuddyContext);
  if (!ctx) {
    throw new Error("useStudyBuddy must be used within StudyBuddyProvider");
  }
  return ctx;
}
