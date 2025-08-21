// ...other imports
import React, { useState, useEffect, useRef, useCallback } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { motion, AnimatePresence } from "framer-motion";
import MarkdownRenderer from "./markdown";
import { ThumbsUp, ThumbsDown, X, CheckCircle } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useUserCache } from "@/context/userCacheContext";
import {
  checkAnswersVote,
  createCommentForAnswer,
  getQAanswersComments,
  updateAnswerStatus,
  updateAnswersVote,
} from "./backendQA";
import { updateUserPoints } from "@/api/changepoints";
import { useBadges } from "@/context/badgesContext";


dayjs.extend(relativeTime);
const PAGE_SIZE = 3;

interface Answer {
  answer_id: string;
  question_id: string;
  creator: string;
  createdAt: string;
  text: string;
  upvotes: number;
  downvotes: number;
  accepted: boolean;
}

interface PaginatedAnswersProps {
  usersQuestion: boolean;
  answers: Answer[];
  isLoading?: boolean;
  isError?: boolean;
  question_id: string | undefined;
  apikey: string;
}

type MailSentMessageProps = {
  duration?: number;
  onFadeOut?: () => void;
  message: string;
};

const MailSentMessage: React.FC<MailSentMessageProps> = ({
  duration = 3000,
  onFadeOut,
  message,
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onFadeOut) onFadeOut();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFadeOut]);

  return (
    <div
      className={`
        fixed top-5 right-5 bg-green-600 text-white px-6 py-3 rounded-lg
        shadow-lg select-none z-50
        transition-opacity duration-1000 ease-in-out
        ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >
      {message}
    </div>
  );
};

const ErrorCheckedMsg: React.FC<MailSentMessageProps> = ({
  duration = 3000,
  onFadeOut,
  message,
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onFadeOut) onFadeOut();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFadeOut]);

  return (
    <div
      className={`
        fixed top-5 right-5 bg-red-600 text-white px-6 py-3 rounded-lg
        shadow-lg select-none z-50
        transition-opacity duration-1000 ease-in-out
        ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >
      {message}
    </div>
  );
};

export const PaginatedAnswers = ({
  usersQuestion,
  question_id,
  answers,
  apikey,
  isLoading = false,
  isError = false,
}: PaginatedAnswersProps) => {
  const { user, updateUser } = useUser();
  const { badges, setBadges } = useBadges();
  const { hashedEmails, levels, loading: userCacheLoading } = useUserCache();

  const [answerComments, setAnswerComments] = useState<Record<string, any[]>>(
    {}
  );
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [commentPages, setCommentPages] = useState<Record<string, number>>({});
  const COMMENTS_PER_PAGE = 5;

  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAnswerMsg, setShowAnswerMsg] = useState(false);
  const [answerAccepted, setAnswerAccepted] = useState(false);
  const [voteCounts, setVoteCounts] = useState<
    Record<string, { upvotes: number; downvotes: number }>
  >({});

  const commentPanelRef = useRef<HTMLDivElement>(null);

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

  // Handle outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        commentPanelRef.current &&
        !commentPanelRef.current.contains(e.target as Node)
      ) {
        setOpenCommentId(null);
      }
    };
    if (openCommentId)
      document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openCommentId]);

  const accepted = answers.find((a) => a.accepted);
  const unaccepted = answers.filter((a) => !a.accepted);
  const sortedAnswers = [
    ...(accepted ? [accepted] : []),
    ...unaccepted.sort(
      (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
    ),
  ];

  const totalPages = Math.ceil(sortedAnswers.length / PAGE_SIZE);
  const paginatedAnswers = sortedAnswers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    const initVotes: Record<string, { upvotes: number; downvotes: number }> =
      {};
    for (const a of answers) {
      initVotes[a.answer_id] = {
        upvotes: a.upvotes,
        downvotes: a.downvotes,
      };
    }
    setVoteCounts(initVotes);
  }, [answers]);

  const handleVote = async (
    id: string,
    creator: string,
    type: "up" | "down",
    question_id?: string
  ) => {
    setAlreadyVoted(false);
    if (!question_id || !user?.username) return;
    const voteCheck = await checkAnswersVote(
      question_id,
      id,
      user.username,
      apikey
    );
    if (voteCheck) {
      if (type == "up") {
        const result = await updateAnswersVote(
          question_id,
          id,
          "increment",
          user.username,
          "upvotes"
        );
        console.log(result);
        if (result.success) {
          setVoteCounts((prev) => {
            const curr = prev[id];
            const updated = { ...curr, upvotes: curr.upvotes + 1 };
            return { ...prev, [id]: updated };
          });
          updateUserPoints(creator, "increment", 10);
          setAlreadyVoted(false);
        } else {
          setAlreadyVoted(true);
        }
      } else {
        const result = await updateAnswersVote(
          question_id,
          id,
          "increment",
          user.username,
          "downvotes"
        );
        if (result.success) {
          setVoteCounts((prev) => {
            const curr = prev[id];
            const updated = { ...curr, downvotes: curr.downvotes + 1 };
            return { ...prev, [id]: updated };
          });
          updateUserPoints(creator, "increment", 10);
          updateUserPoints(user.username, "decrement", 1);
          updateUser({ points: user.points - 1 });
          setAlreadyVoted(false);
        } else {
          setAlreadyVoted(true);
        }
        console.log(result);
      }
    }
  };

  const toggleComments = async (answer_id: string) => {
    if (openCommentId === answer_id) {
      setOpenCommentId(null);
    } else {
      if (!answerComments[answer_id]) {
        const comments = await getQAanswersComments(
          question_id,
          answer_id,
          apikey
        );
        console.log(comments);
        setAnswerComments((prev) => ({
          ...prev,
          [answer_id]: comments.comments,
        }));
      }
      setOpenCommentId(answer_id);
    }
  };

  const handleSubmitComment = async (answerId: string, text: string) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Simulate async API call — replace with your real API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!user?.username) return;
      const newComment = {
        creator: user.username, // Replace with current user
        text: text,
      };

      setAnswerComments((prev) => ({
        ...prev,
        [answerId]: [...(prev[answerId] || []), newComment],
      }));
      if (!newComment.creator) return;
      const result = await createCommentForAnswer(
        question_id,
        answerId,
        newComment.creator,
        newComment.text,
        apikey
      );
      if (result.success) {
        setNewCommentText("");
        setShowAnswerMsg(true);
        console.log(result);
      } else {
      }
    } catch (err: any) {
      setSubmitError("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatus = async (answer_id: string) => {
    setAnswerAccepted(true);
    if (!question_id) return;
    const result = await updateAnswerStatus(question_id, answer_id, true);
    if (result.success) {
      setAnswerAccepted(true);
      toggleSubBadgeCompletion("Bronze", "Scholar", true)
      console.log(result);
    } else {
      setAnswerAccepted(false);
      console.log("ERROR");
    }
  };

  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageButtons = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return (
      <div className="hidden sm:flex gap-2">
        {pages.map((p, i) =>
          typeof p === "string" ? (
            <span key={i} className="px-2 py-1 text-gray-500 select-none">
              {p}
            </span>
          ) : (
            <button
              key={i}
              onClick={() => changePage(p)}
              className={`px-3 py-1 rounded-md transition-colors duration-200 ${
                p === currentPage
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-10 text-gray-500 animate-pulse">
        Loading answers...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-red-500">
        Failed to load answers. Please try again later.
      </div>
    );
  }

  if (answers.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No answers yet. Be the first to respond!
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      <AnimatePresence mode="wait" initial={false}>
        {paginatedAnswers.map((answer) => (
          <motion.div
            id={`answer-${answer.answer_id}`}
            key={answer.answer_id}
            className=" rounded-lg p-4 shadow-sm relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className={`flex flex-col text-sm text-gray-500 w-full md:w-[700px] p-2 rounded-2xl ${
                answer.accepted
                  ? "border-4 border-green-400 shadow-2xl"
                  : "border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={`https://gravatar.com/avatar/${
                      hashedEmails[answer.creator]
                    }?d=identicon`}
                    alt={answer.creator}
                    className="w-10 h-10 rounded"
                  />
                  <span>
                    {answer.creator} <br />
                    Level: {levels[answer.creator] ?? "N/A"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span>
                    {dayjs(answer.createdAt).format("M/D/YYYY")} -{" "}
                    {dayjs(answer.createdAt).fromNow()} | Points:{" "}
                    {(voteCounts[answer.answer_id]?.upvotes ?? answer.upvotes) -
                      (voteCounts[answer.answer_id]?.downvotes ??
                        answer.downvotes)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const link = `${window.location.origin}/question/${question_id}#answer-${answer.answer_id}`;
                      navigator.clipboard.writeText(link)
                        .then(() => alert("Answer link copied to clipboard!"))
                        .catch(() => alert("Failed to copy link"));
                    }}
                    className=" hover:underline text-sm w-max h-max p-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-800 transition-all duration-300 ease-linear m-1"
                  >
                    Share
                  </button>
                </div>
              </div>

              <div className="w-full max-w-[600px] break-words whitespace-pre-wrap mt-2">
                <MarkdownRenderer body={answer.text} />
              </div>
              {usersQuestion ? (
                answer.accepted ? null : (
                  <div className="mt-2">
                    <motion.button
                      onClick={() => handleStatus(answer.answer_id)}
                      whileTap={{ scale: 0.8 }}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-full text-sm text-white transition-all duration-200 ease-linear"
                    >
                      <CheckCircle /> Accept Answer
                    </motion.button>
                  </div>
                )
              ) : (
                <div className="flex gap-3 mt-4 items-center flex-wrap">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      handleVote(
                        answer.answer_id,
                        answer.creator,
                        "up",
                        question_id
                      )
                    }
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-full text-sm text-white"
                  >
                    <ThumbsUp className="w-4 h-4" />{" "}
                    {voteCounts[answer.answer_id]?.upvotes ?? answer.upvotes}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      handleVote(
                        answer.answer_id,
                        answer.creator,
                        "down",
                        question_id
                      )
                    }
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-full text-sm text-white"
                  >
                    <ThumbsDown className="w-4 h-4" />{" "}
                    {voteCounts[answer.answer_id]?.downvotes ??
                      answer.downvotes}
                  </motion.button>

                  <button
                    onClick={() => toggleComments(answer.answer_id)}
                    className="text-blue-500 underline text-sm"
                  >
                    {openCommentId === answer.answer_id ? "Hide" : "Reveal"}{" "}
                    Comments
                  </button>
                </div>
              )}
            </div>

            {/* Slide-out comment panel */}
            <AnimatePresence>
              {openCommentId === answer.answer_id && (
                <motion.div
                  ref={commentPanelRef}
                  initial={{ x: "100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "100%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-xl z-50 overflow-y-auto p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">Comments</h2>
                      <button onClick={() => setOpenCommentId(null)}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {answerComments[answer.answer_id]?.length ? (
                      <>
                        <ul className="space-y-3 mb-4">
                          {answerComments[answer.answer_id]
                            .slice(
                              (commentPages[answer.answer_id] ?? 0) *
                                COMMENTS_PER_PAGE,
                              ((commentPages[answer.answer_id] ?? 0) + 1) *
                                COMMENTS_PER_PAGE
                            )
                            .map((comment, idx) => (
                              <div
                                key={idx}
                                className="flex flex-col text-sm text-gray-700 max-w-[700px] border-2 p-2 rounded-2xl w-[375px] gap-3"
                              >
                                <div className="flex justify-between items-centerw gap-2">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={hashedEmails[comment.creator]}
                                      alt={comment.creator}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                    <span className="font-medium">
                                      {comment.creator}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 flex flex-row gap-3 w-max  items-center justify-center">
                                    {dayjs(comment.createdAt).format(
                                      "MMM D, YYYY"
                                    )}{" "}
                                    | {dayjs(comment.createdAt).fromNow()}
                                    <div className="w-max ">
                                      Points:{" "}
                                      {!isNaN(comment.upvotes)
                                        ? comment.upvotes - comment.downvotes
                                        : 0}
                                    </div>
                                  </div>
                                </div>
                                <div className="prose prose-sm max-w-none">
                                  <div>{comment.text}</div>
                                </div>
                                <div className="flex gap-3 mt-4 items-center flex-wrap">
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() =>
                                      console.log("upvote comment")
                                    }
                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-full text-sm text-white"
                                  >
                                    <ThumbsUp className="w-4 h-4" />{" "}
                                    {voteCounts[answer.answer_id]?.upvotes ??
                                      answer.upvotes}
                                  </motion.button>

                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() =>
                                      console.log("downvote Comment")
                                    }
                                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-full text-sm text-white"
                                  >
                                    <ThumbsDown className="w-4 h-4" />{" "}
                                    {voteCounts[answer.answer_id]?.downvotes ??
                                      answer.downvotes}
                                  </motion.button>
                                </div>
                              </div>
                            ))}
                        </ul>

                        <div className="flex justify-between text-sm text-gray-600 mt-2">
                          <button
                            disabled={
                              (commentPages[answer.answer_id] ?? 0) === 0
                            }
                            onClick={() =>
                              setCommentPages((prev) => ({
                                ...prev,
                                [answer.answer_id]:
                                  (prev[answer.answer_id] ?? 0) - 1,
                              }))
                            }
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                          >
                            Prev
                          </button>
                          <button
                            disabled={
                              ((commentPages[answer.answer_id] ?? 0) + 1) *
                                COMMENTS_PER_PAGE >=
                              answerComments[answer.answer_id].length
                            }
                            onClick={() =>
                              setCommentPages((prev) => ({
                                ...prev,
                                [answer.answer_id]:
                                  (prev[answer.answer_id] ?? 0) + 1,
                              }))
                            }
                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 mb-4">No comments yet.</div>
                    )}
                  </div>

                  {/* Comment Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newCommentText.trim() || isSubmitting) return;
                      handleSubmitComment(answer.answer_id, newCommentText);
                    }}
                    className="mt-4 border-t pt-4"
                  >
                    <textarea
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring focus:border-blue-400 disabled:opacity-50"
                      rows={3}
                      disabled={isSubmitting}
                    />

                    {submitError && (
                      <div className="text-sm text-red-600 mt-2">
                        {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`mt-2 px-4 py-2 rounded-full text-sm transition-all ${
                        isSubmitting
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {isSubmitting ? "Posting..." : "Post Comment"}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex justify-center items-center gap-2 pt-4 flex-wrap">
        <div className="flex sm:hidden gap-2">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        {getPageButtons()}
      </div>
      {showAnswerMsg && (
        <MailSentMessage message="Comment posted successfully" />
      )}
      {alreadyVoted && (
        <ErrorCheckedMsg message="You already voted this question/Answerx, Can't vote more than once" />
      )}
    </div>
  );
};
