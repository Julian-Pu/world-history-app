import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Save,
  CalendarClock,
  CheckCircle2,
  Eye,
  Edit3,
  Maximize2,
  Minimize2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { TiptapEditorComplete } from '@/components/business-ui/tiptap-editor';

import { useLearningStore } from '@/store/useLearningStore';
import NoteTagEditor from './NoteTagEditor';
import {
  AssociationBar,
  EventPickerDialog,
  FigurePickerDialog,
} from './AssociationPickers';
import type { Note } from '@/types/history';

type NotePatch = Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>;

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

const NoteEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const notes = useLearningStore(state => state.notes);
  const addNote = useLearningStore(state => state.addNote);
  const updateNote = useLearningStore(state => state.updateNote);
  const deleteNote = useLearningStore(state => state.deleteNote);

  const existingNote = useMemo(
    () => (id ? notes.find((n: Note) => n.id === id) : null),
    [id, notes],
  );

  const isNew = !id;

  const [title, setTitle] = useState(existingNote?.title ?? '');
  const [content, setContent] = useState(existingNote?.content ?? '');
  const [tags, setTags] = useState<string[]>(existingNote?.tags ?? []);
  const [eventId, setEventId] = useState<string | undefined>(
    existingNote?.eventId ?? searchParams.get('eventId') ?? undefined,
  );
  const [figureId, setFigureId] = useState<string | undefined>(
    existingNote?.figureId ?? searchParams.get('figureId') ?? undefined,
  );

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>(
    'saved',
  );
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [showFigurePicker, setShowFigurePicker] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [figureSearch, setFigureSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const savedRef = useRef({
    title: existingNote?.title ?? '',
    content: existingNote?.content ?? '',
    tags: existingNote?.tags ?? [],
    eventId: existingNote?.eventId ?? undefined,
    figureId: existingNote?.figureId ?? undefined,
  });

  const isDirty = useMemo(() => {
    return (
      title !== savedRef.current.title ||
      content !== savedRef.current.content ||
      JSON.stringify(tags) !== JSON.stringify(savedRef.current.tags) ||
      eventId !== savedRef.current.eventId ||
      figureId !== savedRef.current.figureId
    );
  }, [title, content, tags, eventId, figureId]);

  const wordCount = useMemo(() => stripHtml(content).length, [content]);

  useEffect(() => {
    if (isDirty) setSaveStatus('unsaved');
  }, [isDirty]);

  // Auto-save on debounce
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      handleSave(true);
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, tags, eventId, figureId]);

  const handleSave = (isAutoSave = false): string | null => {
    const patch: NotePatch = {
      title: title.trim(),
      content,
      tags,
      eventId: eventId || undefined,
      figureId: figureId || undefined,
    };
    setSaveStatus('saving');

    if (isNew) {
      if (!patch.title && !patch.content) {
        setSaveStatus('saved');
        return null;
      }
      const newId = addNote({
        title: patch.title ?? '',
        content: patch.content ?? '',
        tags: patch.tags ?? [],
        eventId: patch.eventId,
        figureId: patch.figureId,
      });
      savedRef.current = {
        title: patch.title ?? '',
        content: patch.content ?? '',
        tags: patch.tags ?? [],
        eventId: patch.eventId,
        figureId: patch.figureId,
      };
      setSaveStatus('saved');
      if (!isAutoSave) navigate(`/notes/edit/${newId}`, { replace: true });
      return newId;
    } else if (id) {
      updateNote(id, patch);
      savedRef.current = {
        title: patch.title ?? '',
        content: patch.content ?? '',
        tags: patch.tags ?? [],
        eventId: patch.eventId,
        figureId: patch.figureId,
      };
      setSaveStatus('saved');
      return id;
    }
    return null;
  };

  const handleBlur = () => {
    if (isDirty) handleSave(true);
  };

  const handleDelete = () => {
    if (id) deleteNote(id);
    navigate('/notes');
  };

  const handleBack = () => {
    if (isDirty) handleSave(true);
    navigate('/notes');
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const SaveStatusText: React.FC = () => {
    if (saveStatus === 'saved') {
      return (
        <span className="flex items-center gap-1 text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5" />
          已保存
        </span>
      );
    }
    if (saveStatus === 'saving') {
      return <span className="text-muted-foreground">保存中...</span>;
    }
    return <span className="text-amber-600">未保存</span>;
  };

  const EditorStatusBar: React.FC = () => (
    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground">
      <span>字数：{wordCount}</span>
      <div className="flex items-center gap-1.5">
        <SaveStatusText />
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleBlur}
            placeholder="笔记标题..."
            className="text-lg font-serif font-semibold border-0 px-0 focus-visible:ring-0 h-auto py-1 w-64 placeholder:text-muted-foreground/50"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="h-8"
            >
              {showPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline ml-1">
                {showPreview ? '编辑' : '预览'}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="h-8"
              aria-label="退出全屏"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <NoteTagEditor tags={tags} onChange={setTags} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <TiptapEditorComplete
              value={content}
              onValueChange={setContent}
              placeholder="开始记录你的历史学习心得..."
              readOnly={showPreview}
              className="flex-1"
            />
          </div>
          <EditorStatusBar />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBack} aria-label="返回">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg md:text-xl font-serif font-semibold text-foreground">
                {isNew ? '新建笔记' : '编辑笔记'}
              </h1>
              {existingNote && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" />
                  更新于 {formatDate(existingNote.updatedAt)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <SaveStatusText />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(true)}
              className="h-9"
              aria-label="全屏编辑"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="h-9"
            >
              {showPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline ml-1">
                {showPreview ? '编辑' : '预览'}
              </span>
            </Button>
            {!isNew && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">删除</span>
              </Button>
            )}
            <Button onClick={() => handleSave(false)} disabled={!isDirty} className="h-9">
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">保存</span>
            </Button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-border">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleBlur}
              placeholder="笔记标题..."
              className="text-xl md:text-2xl font-serif font-semibold border-0 px-0 focus-visible:ring-0 h-auto py-1 placeholder:text-muted-foreground/50"
            />
          </div>

          <NoteTagEditor tags={tags} onChange={setTags} />

          <AssociationBar
            eventId={eventId}
            figureId={figureId}
            onEventChange={setEventId}
            onFigureChange={setFigureId}
            onEventPickerOpen={() => {
              setShowEventPicker(true);
              setEventSearch('');
            }}
            onFigurePickerOpen={() => {
              setShowFigurePicker(true);
              setFigureSearch('');
            }}
          />

          <div className="flex flex-col">
            <TiptapEditorComplete
              value={content}
              onValueChange={setContent}
              placeholder="开始记录你的历史学习心得..."
              readOnly={showPreview}
            />
            <EditorStatusBar />
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive-border"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EventPickerDialog
        open={showEventPicker}
        onOpenChange={setShowEventPicker}
        onSelect={setEventId}
        search={eventSearch}
        onSearchChange={setEventSearch}
      />

      <FigurePickerDialog
        open={showFigurePicker}
        onOpenChange={setShowFigurePicker}
        onSelect={setFigureId}
        search={figureSearch}
        onSearchChange={setFigureSearch}
      />
    </div>
  );
};

export default NoteEditorPage;
