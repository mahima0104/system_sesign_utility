import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#030712',
    primaryColor: '#2563eb',
    primaryTextColor: '#f9fafb',
    primaryBorderColor: '#4d83ff',
    lineColor: '#4d83ff',
    secondaryColor: '#1f2937',
    tertiaryColor: '#111827',
    nodeBorder: '#374151',
    clusterBkg: '#111827',
    titleColor: '#f9fafb',
    edgeLabelBackground: '#1f2937',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  flowchart: { curve: 'basis', padding: 20 },
  sequence: { actorMargin: 80 },
});

let diagramCount = 0;

interface Props {
  chart: string;
  caption?: string;
  className?: string;
}

export default function MermaidDiagram({ chart, caption, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${++diagramCount}`);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    setError(null);

    const id = idRef.current;
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch((err) => {
        setError(String(err?.message ?? 'Diagram error'));
      });
  }, [chart]);

  if (error) {
    return (
      <div className={`rounded-xl bg-red-950/30 border border-red-800/50 p-4 text-red-400 text-sm ${className}`}>
        Diagram error: {error}
      </div>
    );
  }

  return (
    <figure className={`mermaid-container flex flex-col items-center gap-3 ${className}`}>
      <div ref={containerRef} className="w-full overflow-x-auto" />
      {caption && <figcaption className="text-xs text-gray-500 text-center">{caption}</figcaption>}
    </figure>
  );
}
