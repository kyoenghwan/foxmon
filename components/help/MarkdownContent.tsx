'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownContent({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`markdown-body text-[14px] text-gray-600 leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src || ''}
              alt={alt || ''}
              className="max-w-full h-auto rounded-lg border border-gray-100 my-3"
            />
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-primary font-bold underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          h1: ({ children }) => <h3 className="text-lg font-black text-gray-900 mt-4 mb-2">{children}</h3>,
          h2: ({ children }) => <h4 className="text-base font-black text-gray-900 mt-3 mb-2">{children}</h4>,
          h3: ({ children }) => <h5 className="text-[15px] font-bold text-gray-800 mt-2 mb-1">{children}</h5>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
          code: ({ className: cn, children }) =>
            cn ? (
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-[12px] my-2">
                <code>{children}</code>
              </pre>
            ) : (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-[13px]">{children}</code>
            ),
          p: ({ children }) => <p className="my-2">{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
