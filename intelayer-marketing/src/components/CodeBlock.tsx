import { ReactNode, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

interface CodeBlockProps {
  children: ReactNode;
  language?: string;
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const CodeBlock = ({ children, language }: CodeBlockProps) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const childContent = Array.isArray(children) ? children.join('') : String(children);

  return (
    <div className="relative rounded-xl border border-border bg-[#05080C] p-4">
      <button
        type="button"
        onClick={async () => {
          const text = codeRef.current?.innerText ?? childContent;
          if (await copyToClipboard(text)) {
            setCopied(true);
          }
        }}
        className="absolute right-4 top-4 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs text-green-200 transition hover:bg-green-500/20"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="overflow-x-auto text-xs text-green-200">
        <code ref={codeRef} className={clsx(language ? `language-${language}` : undefined, 'font-mono')}>
          {childContent}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;
