// ForgotPassword.tsx
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updatepassword } from "@/views/dashboard/backendDashboard";

import { apikey } from "@/api/apikey";

type MailSentMessageProps = {
  duration?: number;
  onFadeOut?: () => void;
  message: string;
};

type ForgotPasswordProps = {
  username: string;
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

export default function ForgotPassword() {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const getStrength = (pwd: string) => {
    if (pwd.length > 17) return "strong";
    if (pwd.length >= 11) return "moderate";
    if (pwd.length > 0) return "weak";
    return "";
  };
  const strength = getStrength(newPassword);
  const strengthStyle =
    {
      weak: "text-red-600 border-red-500",
      moderate: "text-yellow-600 border-yellow-500",
      strong: "text-green-600 border-green-500",
    }[strength as "weak" | "moderate" | "strong"] ||
    "text-gray-500 border-gray-300";

  const handleClickOutside = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handlePasswordChange = async () => {
    if (!newPassword) return alert("Password cannot be empty.");
    // TODO: Replace with your password update logic (API call)
    if (strength != "weak") {
      console.log("Password change, Email sent")
      const result = await updatepassword(username, newPassword, apikey);
      console.log(result);
      setShowMessage(true);
      setIsOpen(false);
      setNewPassword("");
      setUsername("")
      return result;
    } else {
      console.log("Password is too weak");
    }
  };

  return (
    <div className="flex items-center justify-center h-max ">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-6 py-2 font-semibold text-lg rounded-lg text-blue-600  hover:text-blue-700 underline transition-all duration-300 cursor-pointer"
      >
        Forgot Password
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              ref={modalRef}
              className="bg-white w-full max-w-md mx-4 rounded-xl shadow-lg p-6 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-xl"
              >
                &times;
              </button>

              <h2 className="text-2xl font-bold mb-4 text-center">
                Reset Password
              </h2>
              <div className="flex flex-col space-y-4">
                <input
                  type="text"
                  placeholder="Enter username"
                  className={`px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 {strengthStyle}`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Enter new password"
                  className={`px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 {strengthStyle}`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {strength && (
                  <span
                    className={`text-sm font-medium w-max p-2 border-2 rounded-2xl mt-1 ${strengthStyle}`}
                  >
                    {strength === "weak" &&
                      "Weak password (must be more than 10 characters)"}
                    {strength === "moderate" && "Moderate password"}
                    {strength === "strong" && "Strong password"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition"
                >
                  Change Password
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {showMessage && (
        <MailSentMessage
          duration={2500}
          onFadeOut={() => setShowMessage(false)}
          message="Password updated succesfully"
        />
      )}
    </div>
  );
}
