'use client';

import { useEffect, useRef } from 'react';

interface ComparisonAIResultProps {
  html: string;
}

export default function ComparisonAIResult({ html }: ComparisonAIResultProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Executa scripts Chart.js se presentes no HTML
    if (containerRef.current) {
      const scripts = containerRef.current.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [html]);

  return (
    <div className="mb-8">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Relatório Comparativo Gerado por IA
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Análise completa com dados da web, especificações técnicas e recomendações
          </p>
        </div>

        <div
          ref={containerRef}
          className="
            p-6
            prose prose-slate max-w-none
            
            prose-headings:text-slate-900
            prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4
            prose-h2:text-2xl prose-h2:font-semibold prose-h2:mb-3 prose-h2:mt-8
            prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-2 prose-h3:mt-6
            prose-h4:text-lg prose-h4:font-medium prose-h4:mb-2
            
            prose-p:text-slate-700 prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            
            prose-strong:text-slate-900 prose-strong:font-semibold
            prose-em:text-slate-700
            
            prose-ul:list-disc prose-ul:pl-5 prose-ul:my-4
            prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-4
            prose-li:text-slate-700 prose-li:my-1
            
            prose-table:w-full prose-table:border-collapse prose-table:my-6
            prose-table:shadow-md prose-table:rounded-lg prose-table:overflow-hidden
            prose-thead:bg-slate-100
            prose-th:text-left prose-th:font-semibold prose-th:text-slate-900
            prose-th:px-4 prose-th:py-3 prose-th:border-b prose-th:border-slate-200
            prose-td:px-4 prose-td:py-3 prose-td:border-b prose-td:border-slate-100
            prose-td:text-slate-700
            prose-tr:transition-colors hover:prose-tr:bg-slate-50
            
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500
            prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600
            
            prose-code:text-sm prose-code:bg-slate-100 prose-code:px-1.5 
            prose-code:py-0.5 prose-code:rounded prose-code:text-slate-800
            
            prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:p-4 
            prose-pre:rounded-lg prose-pre:overflow-x-auto
            
            prose-img:rounded-lg prose-img:shadow-md
          "
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <p className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Relatório gerado com OpenAI GPT-4
        </p>
        <button
          onClick={() => {
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comparacao-veiculos-${new Date().getTime()}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Baixar HTML
        </button>
      </div>
    </div>
  );
}