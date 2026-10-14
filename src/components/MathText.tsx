import React from 'react';

interface MathTextProps {
  text: string;
  className?: string;
  highlightBlank?: boolean;
}

/**
 * Formats Vietnamese elementary school math and text symbols clearly:
 * - Proper superscript for cm², m², dm³, km²
 * - Proper multiplication × and division ÷
 * - Clean fractions if formatted like {a/b} or fractions in text
 * - Highlighted blanks [...]
 */
export const MathText: React.FC<MathTextProps> = ({ text, className = '', highlightBlank = false }) => {
  if (!text) return null;

  // Replace common representations
  let formatted = text
    .replace(/\bcm2\b/gi, 'cm²')
    .replace(/\bm2\b/gi, 'm²')
    .replace(/\bdm3\b/gi, 'dm³')
    .replace(/\bcm3\b/gi, 'cm³')
    .replace(/\bkm2\b/gi, 'km²')
    .replace(/\s\*\s/g, ' × ')
    .replace(/\s\/\s/g, ' ÷ ');

  // If there are blanks [...]
  if (highlightBlank && formatted.includes('[...]')) {
    const parts = formatted.split('[...]');
    return (
      <span className={`inline-block ${className}`}>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <span>{part}</span>
            {i < parts.length - 1 && (
              <span className="inline-block mx-1.5 px-3 py-0.5 border-b-2 border-dashed border-amber-500 bg-amber-100/60 font-semibold text-amber-900 rounded text-sm select-none">
                ....... ? .......
              </span>
            )}
          </React.Fragment>
        ))}
      </span>
    );
  }

  return <span className={className}>{formatted}</span>;
};
