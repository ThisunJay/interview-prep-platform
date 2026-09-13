"use client";

import { useEffect } from "react";
import { useStudyBuddy } from "@/components/StudyBuddyProvider";

/** Syncs the Study Buddy active category from a study/category page. */
export function StudyBuddyTopicSync({
  categoryName,
  topicNames,
}: {
  categoryName?: string | null;
  topicNames?: string[];
}) {
  const { setActiveCategory, setTopicOptions } = useStudyBuddy();

  useEffect(() => {
    if (topicNames?.length) setTopicOptions(topicNames);
  }, [setTopicOptions, topicNames]);

  useEffect(() => {
    if (categoryName?.trim()) setActiveCategory(categoryName.trim());
  }, [categoryName, setActiveCategory]);

  return null;
}
