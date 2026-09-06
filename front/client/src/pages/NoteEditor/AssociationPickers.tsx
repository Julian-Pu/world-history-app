import { useMemo } from 'react';
import { Flag, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EVENTS } from '@/data/events';
import { FIGURES } from '@/data/figures';

interface AssociationBarProps {
  eventId?: string;
  figureId?: string;
  onEventChange: (id: string | undefined) => void;
  onFigureChange: (id: string | undefined) => void;
  onEventPickerOpen: () => void;
  onFigurePickerOpen: () => void;
}

export const AssociationBar: React.FC<AssociationBarProps> = ({
  eventId,
  figureId,
  onEventChange,
  onFigureChange,
  onEventPickerOpen,
  onFigurePickerOpen,
}) => {
  const eventTitle = useMemo(() => {
    if (!eventId) return '';
    return EVENTS.find(e => e.id === eventId)?.title ?? '';
  }, [eventId]);

  const figureName = useMemo(() => {
    if (!figureId) return '';
    return FIGURES.find(f => f.id === figureId)?.name ?? '';
  }, [figureId]);

  return (
    <div className="px-4 md:px-6 py-3 border-b border-border bg-muted/20">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground mr-1">关联：</span>
        {eventId ? (
          <Badge variant="secondary" className="gap-1.5">
            <Flag className="w-3 h-3" />
            {eventTitle}
            <button
              onClick={() => onEventChange(undefined)}
              className="ml-0.5 hover:text-destructive"
              aria-label="移除事件关联"
            >
              <span className="text-xs">×</span>
            </button>
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onEventPickerOpen}
            className="h-7 text-xs"
          >
            <Flag className="w-3.5 h-3.5" />
            关联事件
          </Button>
        )}
        {figureId ? (
          <Badge variant="outline" className="gap-1.5">
            <Users className="w-3 h-3" />
            {figureName}
            <button
              onClick={() => onFigureChange(undefined)}
              className="ml-0.5 hover:text-destructive"
              aria-label="移除人物关联"
            >
              <span className="text-xs">×</span>
            </button>
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onFigurePickerOpen}
            className="h-7 text-xs"
          >
            <Users className="w-3.5 h-3.5" />
            关联人物
          </Button>
        )}
      </div>
    </div>
  );
};

interface EventPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export const EventPickerDialog: React.FC<EventPickerDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  search,
  onSearchChange,
}) => {
  const filteredEvents = useMemo(() => {
    if (!search.trim()) return EVENTS;
    const q = search.toLowerCase();
    return EVENTS.filter(ev => ev.title.toLowerCase().includes(q));
  }, [search]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>选择关联事件</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="flex flex-col gap-3 max-h-[60vh]">
          <Input
            placeholder="搜索事件..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            autoFocus
          />
          <div className="flex-1 overflow-y-auto border border-border rounded-md divide-y divide-border">
            {filteredEvents.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                没有找到匹配的事件
              </div>
            ) : (
              filteredEvents.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => {
                    onSelect(ev.id);
                    onOpenChange(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-foreground text-sm">
                    {ev.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {ev.location}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface FigurePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export const FigurePickerDialog: React.FC<FigurePickerDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  search,
  onSearchChange,
}) => {
  const filteredFigures = useMemo(() => {
    if (!search.trim()) return FIGURES;
    const q = search.toLowerCase();
    return FIGURES.filter(fg => fg.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>选择关联人物</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="flex flex-col gap-3 max-h-[60vh]">
          <Input
            placeholder="搜索人物..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            autoFocus
          />
          <div className="flex-1 overflow-y-auto border border-border rounded-md divide-y divide-border">
            {filteredFigures.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                没有找到匹配的人物
              </div>
            ) : (
              filteredFigures.map(fg => (
                <button
                  key={fg.id}
                  onClick={() => {
                    onSelect(fg.id);
                    onOpenChange(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-foreground text-sm">
                    {fg.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {fg.content.elementary?.identity ?? ''}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
