import type { Question } from "@/types/questions";
import dayjs from "dayjs";

/**
 * Filters and sorts questions based on a search query.
 * Matches on title, text, creator username, or creation date (M/D/YYYY).
 *
 * @param questions - List of questions to search through.
 * @param query - Search string, e.g., "react", "john", "7/31/2025".
 * @returns Filtered and sorted list of matching questions.
 */
export const searchQuestions = (questions: Question[], query: string): Question[] => {
  const trimmedQuery = query.trim().toLowerCase();

  if (!trimmedQuery) {
    // Default: return all questions sorted by date (newest first)
    return [...questions].sort((a, b) => b.createdAt - a.createdAt);
  }

  return questions
    .filter((q) => {
      const createdAtFormatted = dayjs(q.createdAt).format("M/D/YYYY").toLowerCase();
      return (
        q.title.toLowerCase().includes(trimmedQuery) ||
        q.text.toLowerCase().includes(trimmedQuery) ||
        q.creator.toLowerCase().includes(trimmedQuery) ||
        createdAtFormatted.includes(trimmedQuery)
      );
    })
    .sort((a, b) => b.createdAt - a.createdAt); // Sort by newest
};
