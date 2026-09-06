import { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NoteTagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

const NoteTagEditor: React.FC<NoteTagEditorProps> = ({
  tags,
  onChange,
  maxTags = 10,
}) => {
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setTagInput('');
      return;
    }
    if (tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  return (
    <div className="px-4 md:px-6 py-3 border-b border-border bg-muted/20">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
          <Tag className="w-3 h-3" />
          标签：
        </span>
        <div className="flex flex-wrap gap-1.5 flex-1">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-0.5 hover:text-destructive"
                aria-label={`删除标签 ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {tags.length < maxTags && (
            <form onSubmit={handleAddTag} className="inline-flex">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="添加标签"
                className="h-6 w-24 text-xs px-2 py-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                aria-label="添加标签"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </form>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {tags.length}/{maxTags}
        </span>
      </div>
    </div>
  );
};

export default NoteTagEditor;
