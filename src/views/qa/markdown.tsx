import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

type MarkdownRendererProps = {
  className?: string;
  body: string;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ className = "", body }) => {
  return (
    <div
      className={`prose prose-pre:whitespace-pre-wrap prose-code:break-words max-w-none dark:prose-invert break-words whitespace-pre-wrap ${className}`}
    >
      <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
        {body}
      </ReactMarkdown>
    </div>
  );
};


export default MarkdownRenderer;
