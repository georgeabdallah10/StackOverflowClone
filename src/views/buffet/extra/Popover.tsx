import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MarkdownPreview from "@/components/miniUI/MarkdownPreview";
import { createQuestion } from "../backendBuffet";
import updateUserStorageField, {
  getUserLocal,
} from "@/components/backendUserLocal";
import { useUser } from "@/context/UserContext";
import { updateUserPoints } from "@/api/changepoints";
import { apikey } from "@/api/apikey";




interface PopoverProps {
  onClose: () => void;
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
  const [visible, setVisible] = useState(true);

  useEffect(() => {
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
        shadow-lg select-none z-50 transition-opacity duration-1000 ease-in-out
        ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >
      {message}
    </div>
  );
};

const Popover: React.FC<PopoverProps> = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, updateUser } = useUser();
  const [tags, setTags] = useState<string[]>([""]);
  const [tbq, setTbq] = useState<Record<string, string[]>>();

  const handleTagChange = (index: number, value: string) => {
    const updated = [...tags];
    updated[index] = value;
    setTags(updated);
  };
  const addTagField = () => {
    if (tags.length < 5) {
      setTags([...tags, ""]);
    }
  };



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleCreate = async () => {

    const result = await createQuestion(user?.username, title, text, apikey);

    const existing: Record<string, string[]> =
      JSON.parse(localStorage.getItem("tagsByQuestion") || "{}");

    // 3. Add the new question and its tags
    existing[title] = tags.filter((tag) => tag.trim() !== "");

    // 4. Save updated object back to localStorage
    localStorage.setItem("tagsByQuestion", JSON.stringify(existing));

    // 5. Optionally update local state if you want to use it immediately
    setTbq(existing);

    console.log("Stored locally:", existing);
    console.log(result);
    setShowMessage(true);
    onClose();
    if (!user) return;
    const newPoint = user.points + 1;
    updateUser({ points: newPoint });
    await updateUserPoints(user.username, "increment", 1)
    updateUserStorageField("points", user.points + 1);
  };

  const insertText = (before: string, after: string = "") => {
    const textarea = document.getElementById(
      "markdown-text"
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    const newText =
      textarea.value.substring(0, start) +
      before +
      selectedText +
      after +
      textarea.value.substring(end);

    setText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = end + before.length;
    }, 0);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden relative"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl font-bold"
          >
            &times;
          </button>

          {/* Form Section */}
          <div className="md:w-1/2 w-full p-4 sm:p-6 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Write your note</h2>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                ["Bold", "**", "**"],
                ["Italic", "_", "_"],
                ["Code", "`", "`"],
                ["Header", "### ", ""],
              ].map(([label, before, after]) => (
                <button
                  key={label}
                  className="text-sm px-2 py-1 border rounded hover:bg-gray-100"
                  onClick={() => insertText(before, after)}
                >
                  {label}
                </button>
              ))}
            </div>


            {tags.map((tag, i) => (
              <input
                key={i}
                className="border rounded-lg px-3 py-2 mb-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="text"
                placeholder="Tag..."
                value={tag}
                onChange={(e) => handleTagChange(i, e.target.value)}
              />
            ))}

            {tags.length < 5 && (
              <button
                type="button"
                className="px-3 py-1 text-white bg-blue-500 rounded-lg mb-4"
                onClick={addTagField}
              >
                + Add Tag
              </button>
            )}

            <input
              className="border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              placeholder="Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              id="markdown-text"
              className="border rounded-lg px-3 py-2 flex-grow resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 md:h-auto"
              placeholder="Write body text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <button
              className="mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              onClick={handleCreate}
            >
              Create question
            </button>
          </div>

          {/* Preview */}
          <div className="md:w-1/2 w-full p-4 sm:p-6 overflow-y-auto bg-gray-50 rounded-b-2xl md:rounded-b-none md:rounded-r-2xl">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <MarkdownPreview content={`# ${title}\n\n${text}`} />
          </div>
        </motion.div>
      </AnimatePresence>
      {showMessage && (
        <MailSentMessage
          duration={2500}
          onFadeOut={() => setShowMessage(false)}
          message="Question created successfully, You gained 1 point!"
        />
      )}
    </div>
  );
};

export default Popover;
