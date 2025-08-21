import { useParams } from "react-router-dom";

import {
  getQAanswers,
  getQAquestion,
  getQAcomments,
  createAnswer,
  updateQuestionViews,
  createCommentforQuestion,
  checkQuestionVoted,
  updateQuestionVote,
  getOngoingVoteType,
  updateQuestionStatus,
} from "./backendQA";
import React, { useState, useEffect } from "react";
import type { Question } from "@/types/questions";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import MarkdownRenderer from "./markdown";
import { PaginatedAnswers } from "./paginated";
import PaginatedComments from "./paginatedComments";
import { useUser } from "@/context/UserContext";
import { updateUserPoints } from "@/api/changepoints";
import { motion } from "framer-motion";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useUserCache } from "@/context/userCacheContext";
dayjs.extend(relativeTime);
import { apikey } from "@/api/apikey";
import type { tagsByQuestion } from "@/types/local";
import { useBounty } from "@/context/useBounty";
import { bountyDB } from "@/db/bountyDB";
type VoteType = "closed" | "protected" | "open";

type MailSentMessageProps = {
  duration?: number;
  onFadeOut?: () => void;
  message: string;
};

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

export interface Comment {
  comment_id: string;
  creator: string;
  title: string;
  text: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
}

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

interface Props {
  questionId: string;
  currentUserId: string | undefined;
  answerAuthorId: string;
}

export function BountyPanel({
  questionId,
  currentUserId,
  answerAuthorId,
}: Props) {
  const { user, updateUser } = useUser();
  const { bounty, addBounty, awardBounty } = useBounty(questionId);
  const [amount, setAmount] = useState<number>(75);

  if (!user) return <div>Loading user...</div>;

  return (
    <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 8 }}>
      <div>💳 Your points: {user.points}</div>
      {bounty ? (
        <div>
          <strong>💰 {bounty.amount} pts bounty</strong>
          <div>Added by: {bounty.addedByUserId}</div>
          {bounty.awardedToUserId ? (
            <div>✅ Awarded to: {bounty.awardedToUserId}</div>
          ) : (
            <button
              onClick={async () => {
                const answerUser = (await bountyDB.users.get(
                  answerAuthorId
                )) || {
                  id: answerAuthorId,
                  username: `User-${answerAuthorId}`,
                  points: 500,
                };
                if (!answerUser.id) await bountyDB.users.put(answerUser);
                await awardBounty(answerUser);
              }}
            >
              Award Bounty
            </button>
          )}
        </div>
      ) : (
        <div>
          <input
            type="number"
            min={75}
            max={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <button onClick={() => addBounty(amount)} className="w-max h-max border">Add Bounty</button>
        </div>
      )}
    </div>
  );
}

export default function QA() {
  const [newAnswer, setNewAnswer] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isError, setIsError] = useState(false);
  const [isErrorComments, setIsErrorComments] = useState(false);
  const [isErrorQuestion, SetIsErrorQuestoin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showCommentsMsg, setShowCommentMsg] = useState(false);
  const [showAnswerMsg, setShowAnswerMsg] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [alreadyVotedTarget, setAlreadyVotedTarget] = useState("");
  const [usersQuestion, setUsersQuestion] = useState(false);
  const { user, updateUser } = useUser();
  const { hashedEmails, levels } = useUserCache();
  const { questionid } = useParams<string>();
  const [tbq, setTbq] = useState<tagsByQuestion>();
  const [question, setQuestion] = useState<Question>({
    creator: "",
    title: "",
    createdAt: 0,
    text: "",
    status: "",
    hasAcceptedAnswer: false,
    upvotes: 0,
    downvotes: 0,
    answers: 0,
    views: 0,
    comments: 0,
    question_id: "",
    acceptedAnswerId: false,
    openVotes: null,
    closedVotes: null,
    protectedVotes: null,
    bounty: false,
    bountyValue: 0,
  });

  useEffect(() => {
    setTbq(JSON.parse(localStorage.getItem("tagsByQuestion") || "{}"));
  }, [])

  const [ongoingVote, setOngoingVote] = useState<
    "protected" | "closed" | "open" | null
  >(null);
  ///const { bounty, addBounty, awardBounty } = useBounty(question.question_id);
  const [amount, setAmount] = useState(75);

  const [answers, setanswers] = useState<Answer[]>([]);

  const [comments, setComments] = useState<Comment[]>([]);

  const handleAddAnswer = async () => {
    if (isError) {
      console.log("ERROR");
    } else {
      if (newAnswer.length <= 3000) {
        if (!user?.username) return;
        const result = await createAnswer(
          questionid,
          user.username,
          newAnswer,
          apikey
        );
        if (result.success) {
          console.log(result);
          setNewAnswer("");
          if (!user?.points) return;
          updateUser({ points: user.points + 2 });
          updateUserPoints(user.username, "increment", 2);
          setShowAnswerMsg(true);
          if (!result.answer) return;
          setanswers((prev) => [...prev, result.answer]);
          setNewAnswer("");
          setShowAnswerMsg(true);
        } else {
          console.log("Couldnt Add answer");
          setShowAnswerMsg(false);
        }
      }
    }
  };

  const handleAddComment = async (text: string) => {
    if (newComment.length <= 150) {
      // call API to add comment
      if (!user?.username) return;
      const result = await createCommentforQuestion(
        question.question_id,
        user.username,
        text,
        apikey
      );
      if (!result.comment) return;
      setComments((prev) => [...prev, result.comment]);
      console.log(result);
      setShowCommentMsg(true);
      setNewComment("");
    }
  };

  useEffect(() => {
    const fetchsum = async () => {
      if (!user?.username) return;
      const voteCheck = await checkQuestionVoted(
        question.question_id,
        user.username,
        apikey
      );
      if (voteCheck) {
        setAlreadyVoted(true);
        setAlreadyVotedTarget(voteCheck.vote);
        console.log(setAlreadyVotedTarget);
      }
    };
    fetchsum();
  }, [question]);

  const handlevote = async (target: string) => {
    if (!user?.username) return;
    const voteCheck = await checkQuestionVoted(
      question.question_id,
      user.username,
      apikey
    );
    console.log(voteCheck);

    if (voteCheck) {
      if (alreadyVoted) {
        if (target == "u") {
          const result = await updateQuestionVote(
            question.question_id,
            "increment",
            user.username,
            "upvotes"
          );
          console.log(result);
          setQuestion((prev) => ({
            ...prev,
            upvotes: prev.upvotes + 1,
          }));
          updateUserPoints(question.creator, "increment", 5);
          setAlreadyVoted(true);
          setAlreadyVotedTarget("upvotes");
        } else {
          const result = await updateQuestionVote(
            question.question_id,
            "increment",
            user.username,
            "downvotes"
          );
          console.log(result);
          setQuestion((prev) => ({
            ...prev,
            downvotes: prev.downvotes + 1,
          }));
          updateUserPoints(question.creator, "decrement", 1);
          updateUserPoints(user.username, "decrement", 1);
          updateUser({ points: user.points - 1 });
          setAlreadyVoted(true);
          setAlreadyVotedTarget("downvotes");
        }
      }
    } else {
      setAlreadyVoted(true);
    }
  };

  useEffect(() => {
    const fetchQuestionsAndAnswers = async () => {
      if (!questionid) return;
      // First: fetch question (no loading/error state here)
      const result = await getQAquestion(questionid, apikey);
      SetIsErrorQuestoin(false);
      if (result.success) {
        SetIsErrorQuestoin(false);
        setQuestion((prev) => ({
          ...prev,
          creator: result.question.creator,
          title: result.question.title,
          createdAt: result.question.createdAt,
          text: result.question.text,
          status: result.question.status,
          hasAcceptedAnswer: result.question.hasAcceptedAnswer,
          upvotes: result.question.upvotes,
          downvotes: result.question.downvotes,
          answers: result.question.answers,
          views: result.question.views,
          comments: result.question.comments,
          question_id: result.question.question_id,
          acceptedAnswerId: result.question.acceptedAnswerId,
        }));
        setOngoingVote(getOngoingVoteType(result.question));
      } else {
        SetIsErrorQuestoin(true);
        console.log(result.error);
      }

      // Then: fetch answers (with loading and error)
      setIsLoading(true);
      setIsError(false);

      const result2 = await getQAanswers(questionid, apikey);
      if (result2.success) {
        setanswers(result2.answers);
        setIsLoading(false);
        setIsError(false);
      } else {
        setIsError(true);
        console.log(result2.error);
      }

      setIsLoadingComments(true);
      setIsErrorComments(false);
      try {
        const result3 = await getQAcomments(questionid, apikey);
        if (result3.success) {
          setComments(result3.comments);
          setIsErrorComments(false);
        } else {
          setIsErrorComments(true);
        }
      } catch (err) {
        console.log(err);
        setIsError(true);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchQuestionsAndAnswers();
  }, []);

  const handleStatusVote = async (type: "closed" | "protected" | "open") => {
    const updatedQuestion = { ...question };

    if (type === "closed") {
      updatedQuestion.closedVotes = (updatedQuestion.closedVotes ?? 0) + 1;
    } else if (type === "protected") {
      updatedQuestion.protectedVotes =
        (updatedQuestion.protectedVotes ?? 0) + 1;
    } else if (type === "open") {
      updatedQuestion.openVotes = (updatedQuestion.openVotes ?? 0) + 1;
    }

    // Update local state
    setQuestion(updatedQuestion);

    // Set ongoing vote
    setOngoingVote(type);

    // Change status if vote threshold reached
    if (!updatedQuestion.closedVotes) return;
    if (!updatedQuestion.protectedVotes) return;
    if (!updatedQuestion.openVotes) return;

    if (type === "closed" && updatedQuestion.closedVotes >= 3) {
      await updateQuestionStatus(updatedQuestion.question_id, "closed");
      updatedQuestion.status = "closed";
      setOngoingVote(null);
    } else if (type === "protected" && updatedQuestion.protectedVotes >= 3) {
      await updateQuestionStatus(updatedQuestion.question_id, "protected");
      updatedQuestion.status = "protected";
      setOngoingVote(null);
    } else if (type === "open" && updatedQuestion.openVotes >= 3) {
      await updateQuestionStatus(updatedQuestion.question_id, "open");
      updatedQuestion.status = "open";
      setOngoingVote(null);
    }

    // Re-sync local state
    setQuestion(updatedQuestion);
  };

  const handleUndoVote = async () => {
    if (!user?.username) return;

    const result = await updateQuestionVote(
      question.question_id,
      "decrement",
      user.username,
      alreadyVotedTarget
    );
    console.log(result);

    // Update local vote count
    setQuestion((prev) => ({
      ...prev,
      upvotes:
        alreadyVotedTarget === "upvotes" ? prev.upvotes - 1 : prev.upvotes,
      downvotes:
        alreadyVotedTarget === "downvotes"
          ? prev.downvotes - 1
          : prev.downvotes,
    }));

    // Clear vote state
    setAlreadyVoted(false);
    setAlreadyVotedTarget("");
  };

  function detectOngoingVote(question: Question): VoteType | null {
    if ((question.closedVotes ?? 0) > 0) return "closed";
    if ((question.protectedVotes ?? 0) > 0) return "protected";
    if ((question.openVotes ?? 0) > 0) return "open";
    return null;
  }

  function handleBounty(){
    if (!user?.points) return;
    updateUser({points: user?.points - amount})
  }

  useEffect(() => {
    const update = async () => {
      if (!question?.question_id) return;
      await updateQuestionViews(question.question_id, "increment");
    };
    update();
  }, [question?.question_id]);

  useEffect(() => {
    if (!user?.username) return;
    console.log("some");
    console.log(question.creator);
    if (user?.username == question.creator) {
      setUsersQuestion(true);
    } else {
      setUsersQuestion(false);
    }
  }, [question.creator]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 mt-20 ">
      <div className="border rounded-lg p-4 shadow-md">
        {usersQuestion ? (
          <div className="font-bold">This question is created by you</div>
        ) : null}
        <div>
          {isErrorQuestion ? (
            <div className=" p-6 max-w-3xl mx-auto bg-red-50 rounded-xl shadow-sm text-center text-red-600 mb-2">
              Error loading questions
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{question.title}</h1>
                <div className="text-sm text-gray-500">
                  <span className="text-[15px] text-gray-500 font-semibold mr-1">
                    Asked:
                  </span>
                  {dayjs(question.createdAt).format("M/D/YYYY")} -{" "}
                  {dayjs(question.createdAt).fromNow()}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <span className="text-[15px] text-gray-500 font-semibold">
                  Views:
                </span>
                {question.views} |
                <span className=" ml-1 text-[15px] text-gray-500 font-semibold">
                  Points:
                </span>
                {question.upvotes - question.downvotes}
              </div>
              <div className="flex items-center mt-2 gap-2">
                <img
                  src={`https://gravatar.com/avatar/${hashedEmails[question.creator]
                    }?d=identicon`}
                  alt={question.creator}
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium">
                  <span className="mr-1 text-[15px] text-gray-500 font-semibold">
                    Creator:
                  </span>
                  {question.creator} <br />
                  <span className="mr-1 text-[15px] text-gray-500 font-semibold">
                    level:
                  </span>{" "}
                  {levels[question.creator]}
                </span>
                <div>
                  {question.status == "open" ? null : question.status ==
                    "closed" ? (
                    <h1 className="w-max h-max flex justify-center items-center border rounded-2xl shadow-2xl p-2 ml-8">
                      <span className="text-2xl m-1">🚫 </span>
                      <strong>
                        This question is closed, No more new answers/comments
                      </strong>
                      <span className="text-2xl m-1">🚫 </span>
                    </h1>
                  ) : question.status == "protected" ? (
                    <h1 className="w-max h-max flex justify-center items-center border rounded-2xl shadow-2xl p-2 ml-8">
                      <span className="text-2xl">🔒 </span>
                      <strong>
                        This question is Protected, only users with level 5+ can
                        answer/comment
                      </strong>
                      <span className="text-2xl">🔒 </span>
                    </h1>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
        <div>
          <MarkdownRenderer body={question.text} />
        </div>
        {usersQuestion ? null : (
          <div className="flex flex-row w-full justify-between">
            <div className="flex gap-3 mt-4 mb-4 items-center flex-wrap p-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handlevote("u")}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-full text-sm text-white transition-all duration-200 ease-linear"
              >
                <ThumbsUp className="w-6 h-6" /> {question.upvotes}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handlevote("d")}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-full text-sm text-white transition-all duration-200 ease-linear"
              >
                <ThumbsDown className="w-6 h-6" /> {question.downvotes}
              </motion.button>
              {alreadyVoted && (
                <div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleUndoVote}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full text-sm text-white transition-all duration-200 ease-linear"
                  >
                    Undo vote
                  </motion.button>
                </div>
              )}
            </div>
            <div className="flex flex-row p-3 gap-4">
              {ongoingVote !== null && (
                <div className="bg-yellow-100 p-2 rounded border text-lg">
                  <strong>Vote in progress:</strong> {ongoingVote.toUpperCase()}{" "}
                  <br />
                  Waiting for more votes to complete
                </div>
              )}

              {question.status === "open" && (
                <>
                  <div className="flex flex-col gap-1 items-center justify-center">
                    <button
                      onClick={() => handleStatusVote("closed")}
                      className={`text-white px-4 py-2 h-max p-4 flex items-center justify-center font-bold text-lg bg-red-600
            hover:bg-red-700 transition-all duration-150 ease-linear rounded-lg
            ${ongoingVote === "closed" || ongoingVote === "protected"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                        }`}
                      disabled={
                        ongoingVote === "closed" || ongoingVote === "protected"
                      }
                    >
                      Close
                    </button>
                    <span className="font-bold text-lg">
                      {question.closedVotes ?? 0}/3
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 items-center justify-center">
                    <button
                      onClick={() => handleStatusVote("protected")}
                      className={`text-white px-4 py-2 h-max p-4 flex items-center justify-center font-bold text-lg bg-gray-500
            hover:bg-gray-700 transition-all duration-300 ease-linear rounded-lg
            ${ongoingVote === "protected" || ongoingVote === "closed"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                        }`}
                      disabled={
                        ongoingVote === "protected" || ongoingVote === "closed"
                      }
                    >
                      Protect
                    </button>
                    <span className="font-bold text-lg">
                      {question.protectedVotes ?? 0}/3
                    </span>
                  </div>
                </>
              )}

              {question.status === "protected" && (
                <button
                  onClick={() => handleStatusVote("closed")}
                  className="text-white px-4 py-2 h-max p-4 flex items-center justify-center font-bold text-lg bg-red-600 
        hover:bg-red-700 transition-all duration-150 ease-linear rounded-lg"
                >
                  Close
                </button>
              )}

              {question.status === "closed" && (
                <button
                  onClick={() => handleStatusVote("open")}
                  className="text-white px-4 py-2 h-max p-4 flex items-center justify-center font-bold text-lg bg-green-600 
        hover:bg-green-700 transition-all duration-150 ease-linear rounded-lg"
                >
                  Reopen
                </button>
              )}
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold mt-2: mb-1">Answers: </h2>
        <div>
          {isError ? (
            <div className=" p-6 max-w-3xl mx-auto bg-red-50 rounded-xl shadow-sm text-center text-red-600 mb-2">
              Error loading Answers
            </div>
          ) : answers.length > 0 ? (
            <PaginatedAnswers
              usersQuestion={usersQuestion}
              answers={answers}
              apikey={apikey}
              isError={isError}
              isLoading={isLoading}
              question_id={questionid}
            />
          ) : (
            <div className="text-center  text-gray-500">No Answers yet.</div>
          )}
        </div>
        <div className="mt-4 space-y-2">
          {isError ? (
            <div className=" p-6 max-w-3xl mx-auto bg-red-50 rounded-xl shadow-sm text-center text-red-600 mb-2">
              Error loading Answers, Cannot create one
            </div>
          ) : (
            <div className="flex flex-row items-center justify-between gap-5 h-max">
              <textarea
                placeholder="Add a new answer (Max 3,000 char)"
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                maxLength={3000}
                className="w-full p-2 border rounded"
              />
              <div className="flex items-center justify-center  flex-col -translate-y-3">
                <h1 className="text-lg font-semibold">Preview</h1>
                <div className="w-[400px] border h-[65px] rounded p-1 ">
                  <MarkdownRenderer body={newAnswer} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleAddAnswer}
            className={`px-4 py-2 rounded ${isError ? "bg-red-600 " : "bg-green-600 text-white"
              }`}
          >
            Submit Answer
          </button>
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Comments: </h2>
        {isErrorComments ? (
          <div className=" p-6 max-w-3xl mx-auto bg-red-50 rounded-xl shadow-sm text-center text-red-600 mb-2">
            Error loading Comments
          </div>
        ) : (
          <div>
            <PaginatedComments
              comments={comments}
              questionId={question.question_id}
              isError={isErrorComments}
              isLoading={isLoadingComments}
            />
          </div>
        )}

        <div className="mt-6">
          <div className="mt-4 space-y-2">
            <textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={150}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={() => handleAddComment(newComment)}
              className="px-4 py-2 bg-blue-600 text-white rounded mt-1"
            >
              Post Comment
            </button>
          </div>
        </div>
      </div>
      {showCommentsMsg && (
        <MailSentMessage message="Comment posted Successfully" />
      )}
      {showAnswerMsg && (
        <MailSentMessage message="Answer created successfully" />
      )}
      {alreadyVoted && (
        <ErrorCheckedMsg message="You already voted this question, Can't vote more than once" />
      )}
    </div>
  );
}
