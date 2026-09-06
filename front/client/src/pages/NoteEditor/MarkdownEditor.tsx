import { useRef } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = '开始记录你的想法...',
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (before: string, after: string = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);
    const newText =
      value.slice(0, start) + before + selectedText + after + value.slice(end);

    onChange(newText);

    // Restore cursor position after the insertion
    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(
        start + before.length,
        newCursorPos - after.length,
      );
    });
  };

  const prependToLines = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Find line boundaries
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    const actualEnd = lineEnd === -1 ? value.length : lineEnd;

    const selectedBlock = value.slice(lineStart, actualEnd);
    const lines = selectedBlock.split('\n');

    // Check if already prefixed (toggle off)
    const alreadyPrefixed = lines.every(line => line.startsWith(prefix));
    const newLines = alreadyPrefixed
      ? lines.map(line => line.slice(prefix.length))
      : lines.map(line => prefix + line);

    const newBlock = newLines.join('\n');
    const newText =
      value.slice(0, lineStart) + newBlock + value.slice(actualEnd);

    onChange(newText);

    requestAnimationFrame(() => {
      textarea.focus();
      const newStart = lineStart + (alreadyPrefixed ? -prefix.length : prefix.length);
      const newEnd =
        lineStart +
        newBlock.length +
        (alreadyPrefixed ? -prefix.length * lines.length : prefix.length * lines.length);
      textarea.setSelectionRange(
        Math.max(lineStart, newStart),
        Math.min(lineStart + newBlock.length, newEnd),
      );
    });
  };

  const handleBold = () => wrapSelection('**');
  const handleItalic = () => wrapSelection('*');
  const handleUnorderedList = () => prependToLines('- ');
  const handleOrderedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    const actualEnd = lineEnd === -1 ? value.length : lineEnd;

    const selectedBlock = value.slice(lineStart, actualEnd);
    const lines = selectedBlock.split('\n');

    // Check if already ordered
    const alreadyOrdered = lines.every(line => /^\d+\.\s/.test(line));
    const newLines = alreadyOrdered
      ? lines.map(line => line.replace(/^\d+\.\s/, ''))
      : lines.map((line, idx) => `${idx + 1}. ${line}`);

    const newBlock = newLines.join('\n');
    const newText =
      value.slice(0, lineStart) + newBlock + value.slice(actualEnd);

    onChange(newText);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + newBlock.length);
    });
  };
  const handleQuote = () => prependToLines('> ');

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1.5 border border-border rounded-md bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          className="h-8 w-8 p-0"
          title="加粗"
          aria-label="加粗"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          className="h-8 w-8 p-0"
          title="斜体"
          aria-label="斜体"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUnorderedList}
          className="h-8 w-8 p-0"
          title="无序列表"
          aria-label="无序列表"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleOrderedList}
          className="h-8 w-8 p-0"
          title="有序列表"
          aria-label="有序列表"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleQuote}
          className="h-8 w-8 p-0"
          title="引用"
          aria-label="引用"
        >
          <Quote className="w-4 h-4" />
        </Button>
      </div>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="min-h-[300px] md:min-h-[400px] resize-y font-sans leading-relaxed p-4"
      />
    </div>
  );
};

export default MarkdownEditor;
