'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// Some users paste plain LaTeX without $...$/$$...$$ delimiters.
// If we see a LaTeX environment and no math delimiters, wrap it so KaTeX can render.
function normalizeMath(content: string) {
  const hasMathDelimiters = /\$\$|\\\[|\\\(|\$/.test(content);
  const hasEnvironment = /\\begin\{.*?\}/.test(content);
  if (!hasMathDelimiters && hasEnvironment) {
    return `$$\n${content}\n$$`;
  }
  return content;
}

export default function MarkdownView({ content }: { content: string }) {
  const safeContent = normalizeMath(content ?? '');

  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[
          [remarkMath, { singleDollarTextMath: true }],
        ]}
        rehypePlugins={[
          [
            rehypeKatex,
            {
              strict: false, // render even if the LaTeX is slightly malformed
            },
          ],
          rehypeRaw,
        ]}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}
