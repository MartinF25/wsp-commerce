import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface BlogPostBodyProps {
  content: string;
}

export function BlogPostBody({ content }: BlogPostBodyProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div
        className="
          prose prose-lg max-w-none

          /* Base text */
          text-brand-text
          prose-p:text-brand-text prose-p:leading-relaxed

          /* Headings */
          prose-headings:font-display prose-headings:text-brand-text prose-headings:font-bold
          prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
          prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-100
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-h4:text-base prose-h4:mt-6 prose-h4:mb-2 prose-h4:uppercase prose-h4:tracking-wide prose-h4:text-brand-muted

          /* Links */
          prose-a:text-brand-accent prose-a:font-medium prose-a:no-underline
          hover:prose-a:underline

          /* Strong / em */
          prose-strong:text-brand-text prose-strong:font-semibold
          prose-em:text-brand-muted

          /* Lists */
          prose-ul:my-4 prose-ol:my-4
          prose-li:text-brand-text prose-li:my-1

          /* Blockquote – green left border, like pull-quote */
          prose-blockquote:border-l-[3px] prose-blockquote:border-brand-accent
          prose-blockquote:pl-5 prose-blockquote:py-0.5
          prose-blockquote:text-brand-muted prose-blockquote:not-italic
          prose-blockquote:bg-green-50/40 prose-blockquote:rounded-r-lg

          /* Tables – technical data look */
          prose-table:w-full prose-table:border-collapse prose-table:text-sm
          prose-thead:bg-gray-50
          prose-th:text-brand-text prose-th:font-semibold prose-th:text-xs
          prose-th:uppercase prose-th:tracking-wide
          prose-th:py-3 prose-th:px-4 prose-th:text-left
          prose-th:border prose-th:border-gray-200
          prose-td:py-3 prose-td:px-4
          prose-td:border prose-td:border-gray-100
          prose-td:text-brand-text
          prose-tr:even:bg-gray-50/50

          /* Code */
          prose-code:bg-gray-100 prose-code:text-brand-text
          prose-code:text-sm prose-code:font-mono
          prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-code:before:content-none prose-code:after:content-none

          /* Pre / code blocks */
          prose-pre:bg-gray-900 prose-pre:text-gray-100
          prose-pre:rounded-xl prose-pre:overflow-x-auto

          /* Images */
          prose-img:rounded-xl prose-img:shadow-sm prose-img:my-8
        "
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Remap any H1 in content to H2 so we never duplicate the page H1
            h1: ({ children }) => <h2>{children}</h2>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
