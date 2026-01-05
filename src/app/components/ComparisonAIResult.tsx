'use client';

interface ComparisonAIResultProps {
  html: string;
}

export default function ComparisonAIResult({ html }: ComparisonAIResultProps) {
  return (
    <div
      className="
        prose prose-slate max-w-none
        prose-table:w-full
        prose-th:bg-slate-100
        prose-th:text-left
        prose-td:border
        prose-td:p-2
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
