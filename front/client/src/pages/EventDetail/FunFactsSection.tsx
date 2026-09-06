import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

interface FunFactsSectionProps {
  facts: string[];
}

const FunFactsSection: React.FC<FunFactsSectionProps> = ({ facts }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800/30 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="font-medium text-foreground">趣味知识</span>
          <span className="text-sm text-muted-foreground">
            ({facts.length} 条)
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <ul className="px-4 pb-4 space-y-2">
            {facts.map((fact: string, index: number) => (
              <li
                key={index}
                className="flex gap-2 text-sm text-foreground/90 leading-relaxed"
              >
                <span className="text-amber-500 font-bold shrink-0">
                  {index + 1}.
                </span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FunFactsSection;
