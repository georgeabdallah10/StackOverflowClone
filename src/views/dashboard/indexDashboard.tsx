import React, { useState, useEffect } from "react";
import type UserLocal from "@/types/userlocal";
import updateUserStorageField, {
  getUserLocal,
} from "@/components/backendUserLocal";
import {
  getquestions,
  getanswers,
  updateEmail,
  updatepassword,
  deleteAccount,
} from "./backendDashboard";
import { motion } from "framer-motion";
import { useUser } from "@/context/UserContext";
import type { Question } from "@/types/questions";
import { useBadges } from "@/context/badgesContext";
import { apikey } from "@/api/apikey";


type MailSentMessageProps = {
  duration?: number;
  onFadeOut?: () => void;
  message: string;
};

type answer = {
  answer_id: string;
  comments: number;
  createdAt: number;
  creator: string;
  text: string;
  question_id: string;
  upvotes: number;
  downvotes: number;
  accepted: boolean;
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

const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style: string;
}) => (
  <div className={`bg-white rounded-2xl shadow p-4 ${style}`}>{children}</div>
);

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4">{children}</div>
);

const Dashboard = () => {
  const { user, updateUser, clearUser } = useUser();
  const [showMessage, SetShowMessage] = useState(false);
  const [showMessage2, SetShowMessage2] = useState(false);
  const { badges } = useBadges();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [questions, setquestoins] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<answer[]>([]);
  const [answersCurrentPage, setAnswersCurrentPage] = useState(1);
  const answersPerPage = 5;
  const answersTotalPages = Math.ceil(answers.length / answersPerPage);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 5;

  const getStrength = (pwd: string) => {
    if (pwd.length > 17) return "strong";
    if (pwd.length >= 11) return "moderate";
    if (pwd.length > 0) return "weak";
    return "";
  };

  const strength = getStrength(password);
  const strengthStyle =
    {
      weak: "text-red-600",
      moderate: "text-yellow-600",
      strong: "text-green-600",
    }[strength as "weak" | "moderate" | "strong"] || "text-gray-500";

  const onUpdateEmail = async (newEmail: string) => {
    if (!user?.username) return;
    const result = await updateEmail(user?.username, newEmail, apikey);
    SetShowMessage(true);
    updateUserStorageField("email", newEmail);
    updateUser({ email: newEmail });
    setEmail("");
    console.log(result);
    return result;
  };

  const onUpdatePassword = async (newPassword: string) => {
    if (strength != "weak") {
      if (!user?.username) return;
      const result = await updatepassword(user.username, newPassword, apikey);
      SetShowMessage2(true);
      setPassword("");
      return result;
    } else {
      console.log("password is too weak");
    }
  };

  const onDeleteAccount = async () => {
    if (!user?.username) return;
    await deleteAccount(user.username, apikey);
    clearUser();
    console.log("Account Deleted");
    window.location.href = "/";
  };
  useEffect(() => {
    if (!user?.username) return;
    const fetchQuestions = async () => {
      const result = await getquestions(user.username, apikey);
      const answersResult = await getanswers(user.username, apikey);
      setquestoins([...questions, ...result.questions]);
      setAnswers(answersResult.answers);
      console.log(answers);
    };
    fetchQuestions();
  }, [user?.username]);

  const totalPages = Math.ceil(questions.length / questionsPerPage);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pt-20">
      <Card style="">
        <CardContent>
          <div className="flex items-center gap-4">
            <img
              src={user?.pfp}
              alt="Profile"
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h2 className="text-xl font-bold">{user?.username}</h2>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Questions - with pagination */}
      <Card style="">
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">Your Questions</h3>
          <div className="space-y-2 relative">
            {questions.length > 0 ? (
              <>
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  {questions
                    .slice(
                      (currentPage - 1) * questionsPerPage,
                      currentPage * questionsPerPage
                    )
                    .map((q) => (
                      <div
                        key={q.question_id}
                        className="p-2 rounded hover:bg-gray-100 cursor-pointer flex justify-between items-center transition-all duration-250 ease-linear"
                        onClick={() =>
                          (window.location.href = `/question/${q.question_id}`)
                        }
                      >
                        <span className="text-[17px]">{q.title}</span>
                        <span className="text-sm text-gray-500">
                          Votes: {q.upvotes}
                        </span>
                      </div>
                    ))}
                </motion.div>

                {/* Pagination Controls */}
                <div className="flex justify-center items-center mt-4 gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-500">
                You have not asked any questions yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Your Answers */}
      <Card style="">
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">Your Answers</h3>
          <div className="space-y-2 relative">
            {answers.length > 0 ? (
              <>
                <motion.div
                  key={answersCurrentPage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  {answers
                    .slice(
                      (answersCurrentPage - 1) * answersPerPage,
                      answersCurrentPage * answersPerPage
                    )
                    .map((a) => (
                      <div
                        key={a.answer_id}
                        className={`p-2 rounded hover:bg-gray-100 cursor-pointer flex justify-between items-center transition-all duration-250 ease-linear ${
                          a.accepted
                            ? " border-3 border-green-500 shadow-2xl"
                            : ""
                        }`}
                        onClick={() =>
                          (window.location.href = `/question/${
                            a.question_id || a.question_id
                          }`)
                        }
                      >
                        <span>{a.text}</span>
                        <span className="text-sm text-gray-500">
                          Votes: {a.upvotes - a.downvotes}
                        </span>
                      </div>
                    ))}
                </motion.div>

                {/* Pagination Controls */}
                <div className="flex justify-center items-center mt-4 gap-2">
                  <button
                    onClick={() =>
                      setAnswersCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={answersCurrentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {answersCurrentPage} of {answersTotalPages}
                  </span>
                  <button
                    onClick={() =>
                      setAnswersCurrentPage((p) =>
                        Math.min(answersTotalPages, p + 1)
                      )
                    }
                    disabled={answersCurrentPage === answersTotalPages}
                    className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-500">
                You have not answered any questions yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card style="">
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">Your badges</h3>
          <div className="flex flex-row gap-2 justify-around relative">
            {Object.values(badges).map((category) => {
              // Calculate the number of completed sub-badges
              const completedCount = Object.values(category.subbadges).filter(
                (sub) => sub.completed
              ).length;
              // Get the total number of sub-badges
              const totalCount = Object.keys(category.subbadges).length;

              return (
                // Important: Add a unique 'key' prop when mapping over lists
                <div className="relative shadow-2xl h-max w-[350px] p-2 justify-center items-center flex flex-col">
                  <div
                    key={category.name}
                    className="relative space-y-2 h-max p-2 justify-center items-center flex flex-col"
                  >
                    <h1
                      className={`font-bold text-2xl drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)] ${
                        category.style === "gold"
                          ? "text-[#E6C200]"
                          : category.style === "silver"
                          ? "text-gray-400"
                          : "text-[#CD7F32]"
                      }`}
                    >
                      {category.name} Badges{" "}
                      <span className="font-medium text-base text-gray-500">
                        {completedCount}/{totalCount}
                      </span>
                    </h1>
                    <div className="relative flex flex-col justify-between h-max gap-2 w-full">
                      {/* Map over the sub-badges for the current category */}
                      {Object.values(category.subbadges).map((sub) => (
                        // Important: Add a unique 'key' prop for each sub-badge
                        <div
                          key={sub.title}
                          className={`flex items-center gap-2 p-2 rounded-lg shadow-sm ${
                            sub.completed
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <span className="inline-flex items-center justify-center">
                            {sub.completed ? (
                              // SVG for a completed badge (check)
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              // SVG for an incomplete badge (cross)
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            )}
                          </span>
                          <div>
                            <span className="font-semibold">{sub.title}:</span>{" "}
                            <span className="font-normal">
                              {sub.description}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card style="">
        <CardContent>
          <h3 className="text-lg font-semibold">Account Settings</h3>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Change Email
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="transition-all duration-300 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm text-base hover:shadow-lg p-3 flex-1"
              />
              <button
                onClick={() => onUpdateEmail(email)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-all duration-300"
              >
                Update
              </button>
            </div>
          </div>
          {showMessage && (
            <MailSentMessage
              duration={2500}
              onFadeOut={() => SetShowMessage(false)}
              message="Email updated successfully"
            />
          )}

          <div className="mt-4 flex flex-col ">
            <label className="block text-sm font-medium mb-1">
              Change Password
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`transition-all duration-300 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm text-base hover:shadow-lg p-3 flex-1 ${
                  strength === "weak"
                    ? "border-red-100"
                    : strength === "moderate"
                    ? "border-yellow-500"
                    : strength === "strong"
                    ? "border-green-500"
                    : "border-gray-300"
                }`}
              />
              <button
                onClick={() => onUpdatePassword(password)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-all duration-300"
              >
                Update
              </button>
            </div>
            {strength && (
              <span
                className={`translate-y-2 text-sm font-medium w-max h-max p-3 border-2 transition-all duration-300 rounded-2xl ${strengthStyle}`}
              >
                {strength === "weak" &&
                  "Weak password (must be > 10 characters), WON'T BE ACCEPTED"}
                {strength === "moderate" && "Moderate password"}
                {strength === "strong" && "Strong password"}
              </span>
            )}
          </div>
          {showMessage2 && (
            <MailSentMessage
              duration={2500}
              onFadeOut={() => SetShowMessage2(false)}
              message="Password updated successfully"
            />
          )}
          <div className="mt-4">
            <button
              onClick={onDeleteAccount}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-all duration-300 "
            >
              Delete Account
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
