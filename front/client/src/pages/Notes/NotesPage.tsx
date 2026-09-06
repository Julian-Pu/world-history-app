import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Trash2,
  StickyNote,
  CalendarClock,
  Users,
  Flag,
  X,
  PenLine,
  ArrowUpDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useLearningStore } from '@/store/useLearningStore';
import { EVENTS } from '@/data/events';
import { FIGURES } from '@/data/figures';
import type { Note } from '@/types/history';

type SortMode = 'updated' | 'created';

const NotesPage: React.FC = () => {
  const navigate = useNavigate();
  const notes = useLearningStore(state => state.notes);
  const deleteNote = useLearningStore(state => state.deleteNote);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEventId, setFilterEventId] = useState('');
  const [filterFigureId, setFilterFigureId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const eventMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const ev of EVENTS) {
      map[ev.id] = ev.title;
    }
    return map;
  }, []);

  const figureMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const fg of FIGURES) {
      map[fg.id] = fg.name;
    }
    return map;
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const n of notes) {
      if (n.tags) {
        for (const t of n.tags) set.add(t);
      }
    }
    return Array.from(set).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n: Note) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q),
      );
    }

    if (filterEventId) {
      result = result.filter((n: Note) => n.eventId === filterEventId);
    }

    if (filterFigureId) {
      result = result.filter((n: Note) => n.figureId === filterFigureId);
    }

    if (selectedTags.length > 0) {
      result = result.filter((n: Note) =>
        selectedTags.every(tag => n.tags?.includes(tag)),
      );
    }

    // Sort
    result.sort((a: Note, b: Note) => {
      const dateA = new Date(
        sortMode === 'created' ? a.createdAt : a.updatedAt,
      ).getTime();
      const dateB = new Date(
        sortMode === 'created' ? b.createdAt : b.updatedAt,
      ).getTime();
      return dateB - dateA;
    });

    return result;
  }, [notes, searchQuery, filterEventId, filterFigureId, selectedTags, sortMode]);

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteNote(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const hasActiveFilters =
    searchQuery || filterEventId || filterFigureId || selectedTags.length > 0;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterEventId('');
    setFilterFigureId('');
    setSelectedTags([]);
  };

  const renderNoteTags = (tags: string[]) => {
    if (!tags || tags.length === 0) return null;
    const visible = tags.slice(0, 3);
    const extra = tags.length - 3;
    return (
      <>
        {visible.map(tag => (
          <Badge key={tag} variant="outline" className="text-[10px] py-0">
            {tag}
          </Badge>
        ))}
        {extra > 0 && (
          <Badge variant="outline" className="text-[10px] py-0">
            +{extra}
          </Badge>
        )}
      </>
    );
  };

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
              我的笔记
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              记录学习心得，整理历史知识要点
              <span className="ml-2">共 {notes.length} 篇笔记</span>
            </p>
          </div>
          <Button onClick={() => navigate('/notes/edit')} className="shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">新建笔记</span>
          </Button>
        </div>

        {/* Search & Filter bar */}
        <div className="bg-card border border-border rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="搜索笔记标题或内容..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Select
                value={sortMode}
                onValueChange={v => setSortMode(v as SortMode)}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <SelectValue placeholder="排序方式" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">最近修改</SelectItem>
                  <SelectItem value="created">最近创建</SelectItem>
                </SelectContent>
              </Select>
              <select
                value={filterEventId}
                onChange={e => setFilterEventId(e.target.value)}
                className="border-input rounded-md border bg-transparent px-3 py-2 text-sm min-w-[140px] h-9 cursor-pointer hover:border-ring focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
              >
                <option value="">全部事件</option>
                {EVENTS.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
              <select
                value={filterFigureId}
                onChange={e => setFilterFigureId(e.target.value)}
                className="border-input rounded-md border bg-transparent px-3 py-2 text-sm min-w-[140px] h-9 cursor-pointer hover:border-ring focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
              >
                <option value="">全部人物</option>
                {FIGURES.map(fg => (
                  <option key={fg.id} value={fg.id}>
                    {fg.name}
                  </option>
                ))}
              </select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9"
                >
                  <X className="w-4 h-4" />
                  清除
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tag filter bar */}
        {allTags.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-3 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">标签筛选：</span>
              {allTags.map(tag => {
                const isActive = selectedTags.includes(tag);
                return (
                  <Badge
                    key={tag}
                    variant={isActive ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes grid */}
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <StickyNote className="w-10 h-10 text-primary" />
            </div>
            {hasActiveFilters ? (
              <>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
                  没有找到匹配的笔记
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  试试调整搜索关键词或筛选条件
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  清除筛选
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
                  还没有笔记
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  记录你的第一篇学习笔记，开始构建知识体系吧
                </p>
                <Button onClick={() => navigate('/notes/edit')}>
                  <PenLine className="w-4 h-4" />
                  写第一篇笔记
                </Button>
              </>
            )}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            data-ai-section-type="card-list"
          >
            {filteredNotes.map((note: Note) => (
              <div
                key={note.id}
                className="group bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-all hover:border-primary/30 cursor-pointer relative"
                onClick={() => navigate(`/notes/edit/${note.id}`)}
              >
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setDeleteTargetId(note.id);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  aria-label="删除笔记"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <h3 className="text-lg font-serif font-semibold text-foreground mb-2 pr-8 line-clamp-1">
                  {note.title || '无标题笔记'}
                </h3>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {note.eventId && eventMap[note.eventId] && (
                    <Badge variant="secondary" className="gap-1">
                      <Flag className="w-3 h-3" />
                      {eventMap[note.eventId]}
                    </Badge>
                  )}
                  {note.figureId && figureMap[note.figureId] && (
                    <Badge variant="outline" className="gap-1">
                      <Users className="w-3 h-3" />
                      {figureMap[note.figureId]}
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {renderNoteTags(note.tags)}
                  </div>
                )}

                {/* Content preview */}
                <div className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]">
                  {note.content ? (
                    <span>{stripHtml(note.content).slice(0, 150)}</span>
                  ) : (
                    <span className="italic">暂无内容</span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>{formatDate(note.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={open => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除笔记？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后将无法恢复，请谨慎操作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive-border"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating action button on mobile */}
      <Link
        to="/notes/edit"
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover-elevate active-elevate-2 z-30"
        aria-label="新建笔记"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
};

export default NotesPage;
