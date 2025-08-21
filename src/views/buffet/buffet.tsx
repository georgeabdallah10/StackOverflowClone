 import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { Question } from "@/types/questions";
import { fetchQuestions } from "@/api/questions";
import { useSearch } from "@/context/SearchContext";
import { searchQuestions } from "@/utility/searchQuestions";
import { Button } from "@/components/miniUI/button";
import Popover from "./extra/Popover";
import dayjs from "dayjs";
import { getUserLocal } from "@/components/backendUserLocal";
import { useUser } from "@/context/UserContext";
import { motion } from "framer-motion";
import { useUserCache } from "@/context/userCacheContext";
import { CheckIcon } from "lucide-react";
import { getanswers, getquestions } from "../dashboard/backendDashboard";
import { useBadges } from "@/context/badgesContext";
import { apikey } from "@/api/apikey";
import type { Tag } from "@/types/local";

/**
 * Available sort types for questions
 */
type SortType = "recent" | "best" | "interesting" | "hot";

/**
 * Mapping of sort types to API parameters
 */
const sortMap: Record<Exclude<SortType, "recent">, "u" | "uvc" | "uvac"> = {
  best: "u",
  interesting: "uvc",
  hot: "uvac",
};

/**
 * Props for the QuestionCard component
 */
interface QuestionCardProps {
  question: Question;
  hashedemail?: string;
  levels?: number;
}

/**
 * Individual question card component with hover animations and sharing functionality
 */
function QuestionCard({ question, hashedemail, levels }: QuestionCardProps) {
  /**
   * Handles copying the question link to clipboard
   */
  const handleShareClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent link navigation when sharing
      
      const link = `${window.location.origin}/question/${question.question_id}`;
      
      navigator.clipboard
        .writeText(link)
        .then(() => alert("Link copied to clipboard!"))
        .catch(() => alert("Failed to copy link"));
    },
    [question.question_id]
  );

  return (
    <motion.a
      href={`/question/${question.question_id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full sm:w-[48%] lg:w-[31%]"
    >
      <div className="rounded-2xl border p-4 hover:shadow-xl transition-all duration-300 bg-white mb-3 h-full">
        {/* Question Header */}
        <div className="text-lg sm:text-xl font-semibold mb-1 text-gray-800 flex flex-row items-center justify-between">
          <span className="flex-1 pr-2">{question.title}</span>
          <CheckIcon
            className={`w-8 h-8 p-1 flex-shrink-0 ${
              question.hasAcceptedAnswer ? "bg-green-500" : "bg-gray-500"
            } text-white rounded-xl`}
            aria-label={question.hasAcceptedAnswer ? "Has accepted answer" : "No accepted answer"}
          />
        </div>

        {/* Question Metadata */}
        <div className="text-sm text-gray-700 flex flex-col gap-1">
          <span className="text-base">
            <b>Votes:</b> {question.upvotes - question.downvotes}
          </span>
          
          <span className="text-base">
            <b>Views:</b> {question.views.toLocaleString()}
          </span>
          
          <span className="text-base">
            <b>Comments:</b> {question.comments}
          </span>
          
          <span className="text-base">
            <b>Answers:</b> {question.answers}
          </span>
          
          {/* Creator Information */}
          <span className="text-base flex items-center gap-2 flex-row">
            <img
              src={`https://gravatar.com/avatar/${hashedemail}?d=identicon`}
              alt={`${question.creator}'s avatar`}
              className="w-6 h-6 rounded-full"
            />
            <span className="font-bold">Creator:</span> {question.creator} |{" "}
            Level {levels ?? "N/A"}
          </span>
          
          {/* Creation Date */}
          <span className="text-xs text-gray-500">
            {dayjs(question.createdAt).format("M/D/YYYY")} –{" "}
            {dayjs(question.createdAt).fromNow()}
          </span>
          
          {/* Share Button */}
          <button
            onClick={handleShareClick}
            className="mt-2 text-sm w-max px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 ease-in-out"
            type="button"
          >
            Share
          </button>
        </div>
      </div>
    </motion.a>
  );
}

/**
 * Main Buffet component - displays a paginated list of questions with sorting and search functionality
 */
export default function Buffet() {
  // State Management
  const [sortType, setSortType] = useState<SortType>("recent");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [afterCursor, setAfterCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [show, setShow] = useState(false);
  const [isLoggedin, setLoggedIn] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Context Hooks
  const { searchQuery } = useSearch();
  const { user } = useUser();
  const { badges, setBadges } = useBadges();
  const { hashedEmails, levels, loading: usersLoading } = useUserCache();

  // Refs
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  /**
   * Memoized filtered questions based on search query
   */
  const filteredQuestions = useMemo(() => {
    return searchQuestions(questions, searchQuery);
  }, [questions, searchQuery]);

  /**
   * Toggles badge completion status for sub-badges
   */
  const toggleSubBadgeCompletion = useCallback(
    (categoryName: string, subBadgeTitle: string, isCompleted: boolean) => {
      setBadges((currentBadges) => {
        const newBadges = { ...currentBadges };
        const categoryToUpdate = newBadges[categoryName];
        
        if (!categoryToUpdate) return currentBadges;

        const newCategory = { ...categoryToUpdate };
        const subBadgeToUpdate = newCategory.subbadges[subBadgeTitle];
        
        if (!subBadgeToUpdate || subBadgeToUpdate.completed === isCompleted) {
          return currentBadges;
        }

        newCategory.subbadges = {
          ...newCategory.subbadges,
          [subBadgeTitle]: {
            ...subBadgeToUpdate,
            completed: isCompleted,
          },
        };

        newBadges[categoryName] = newCategory;
        return newBadges;
      });
    },
    [setBadges]
  );

  /**
   * Fetches user questions and updates badge progress based on vote counts
   */
  useEffect(() => {
    if (!user?.username) return;
    
    const fetchUserQuestions = async () => {
      try {
        const result = await getquestions(user.username, apikey);
        const answersResult = await getanswers(user.username, apikey);
        
        // Update badges based on question vote counts
        result.questions?.forEach((question: any) => {
          const netTotal = question.upvotes - question.downvotes;
          
          if (netTotal >= 100) {
            toggleSubBadgeCompletion("Gold", "Great Question", true);
          } else if (netTotal >= 25) {
            toggleSubBadgeCompletion("Silver", "Good Question", true);
          } else if (netTotal >= 10) {
            toggleSubBadgeCompletion("Bronze", "Nice Question", true);
          }
        });
      } catch (error) {
        console.error("Error fetching user questions:", error);
      }
    };
    
    fetchUserQuestions();
  }, [user?.username, toggleSubBadgeCompletion]);

  /**
   * Handles scroll events for back-to-top button visibility
   */
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * Fetches more questions with pagination
   */
  const fetchMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const param = sortType === "recent" ? "d" : sortMap[sortType];
      const response = await fetchQuestions(param, afterCursor);
      console.log("Fetched questions:", response);

      if (!response || response.length === 0) {
        setHasMore(false);
      } else {
        setQuestions((prev) => [...prev, ...response]);
        setAfterCursor(response[response.length - 1]?.question_id);
      }
    } catch (error: any) {
      setError(error);
      console.error("Error fetching questions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, sortType, afterCursor]);

  /**
   * Reset questions and fetch new ones when sort type changes
   */
  useEffect(() => {
    const resetAndFetch = async () => {
      setQuestions([]);
      setAfterCursor(undefined);
      setHasMore(true);
      setError(null);
      
      // Fetch immediately with new sort type
      setIsLoading(true);

      try {
        const param = sortType === "recent" ? "d" : sortMap[sortType];
        const response = await fetchQuestions(param, undefined);
        console.log("Fetched questions for new sort:", response);

        if (!response || response.length === 0) {
          setHasMore(false);
        } else {
          setQuestions(response);
          setAfterCursor(response[response.length - 1]?.question_id);
        }
      } catch (error: any) {
        setError(error);
        console.error("Error fetching questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    resetAndFetch();
  }, [sortType]);

  /**
   * Set up intersection observer for infinite scroll
   */
  useEffect(() => {
    if (!loaderRef.current || !hasMore || isLoading) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading && hasMore) {
          fetchMore();
        }
      },
      { threshold: 1.0 }
    );

    observer.current.observe(loaderRef.current);

    return () => observer.current?.disconnect();
  }, [hasMore, isLoading, fetchMore]);

  /**
   * Check if user is logged in on component mount
   */
  useEffect(() => {
    const localUser = getUserLocal();
    setLoggedIn(!!localUser);
  }, []);

  /**
   * Handles back to top button click
   */
  const handleBackToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /**
   * Sort button configuration
   */
  const sortButtons = ["recent", "best", "interesting", "hot"] as const;

  // Loading State
  if (isLoading && questions.length === 0) {
    return (
      <div className="pt-16 p-6 max-w-3xl mx-auto bg-gray-50 rounded-xl shadow-sm mt-20 text-center text-gray-700">
        Loading questions...
      </div>
    );
  }

  // Error State
  if (error && questions.length === 0) {
    return (
      <div className="pt-16 p-6 max-w-3xl mx-auto bg-red-50 rounded-xl shadow-sm mt-20 text-center text-red-600">
        Error loading questions: {error.message || "Unknown error"}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75 }}
      className="pt-16 p-4 sm:p-6 max-w-screen-xl mx-auto space-y-6 bg-gray-50 rounded-xl shadow-md mt-20"
    >
      {/* Header Section with Sort Buttons and Create Question */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-4">
        {/* Sort Buttons */}
        <div className="flex flex-wrap gap-2">
          {sortButtons.map((type) => (
            <button
              key={type}
              onClick={() => setSortType(type)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-full font-medium transition text-sm sm:text-base border disabled:opacity-50 disabled:cursor-not-allowed ${
                sortType === type
                  ? "bg-gray-800 text-white border-transparent shadow-sm"
                  : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Create Question Button (Only for logged in users) */}
        {isLoggedin && (
          <Button
            className="bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 transition-all duration-300 ease-linear rounded-full shadow"
            onClick={() => setShow(true)}
          >
            Create a question
          </Button>
        )}
      </div>

      {/* Create Question Popover */}
      {show && <Popover onClose={() => setShow(false)} />}

      {/* Questions Grid */}
      <div className="flex flex-wrap gap-4 justify-start">
        {filteredQuestions.length === 0 ? (
          <div className="text-center text-gray-500 w-full py-8">
            {isLoading ? "Loading questions..." : "No questions found."}
          </div>
        ) : (
          filteredQuestions.map((question, index) => (
            <QuestionCard
              key={`${question.question_id}-${index}`}
              question={question}
              hashedemail={hashedEmails?.[question.creator]}
              levels={levels?.[question.creator]}
            />
          ))
        )}
      </div>

      {/* Infinite Scroll Loader */}
      <div ref={loaderRef} className="text-center text-gray-500 py-4">
        {isLoading && questions.length > 0 && "Loading more..."}
        {!hasMore && questions.length > 0 && "No more questions"}
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={handleBackToTop}
          className="fixed bottom-6 right-6 z-50 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-200"
          aria-label="Back to top"
        >
          Back to Top ↑
        </motion.button>
      )}
    </motion.div>
  );
}