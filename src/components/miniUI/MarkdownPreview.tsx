// MarkdownPreview.tsx
import React from "react";
import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
}

const MarkdownPreview: React.FC<Props> = ({ content }) => {
  return (
    <div className="prose max-w-none overflow-y-auto h-full whitespace-pre-wrap">

      <ReactMarkdown>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;
 