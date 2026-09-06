import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowLeft,
  X,
  Clock,
  Trash2,
  Filter,
  Calendar,
  MapPin,
  BookOpen,
  UserRound,
  StickyNote,
  Inbox,
} from 'lucide-react';
import { Input } from '@client/src/components/ui/input';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@client/src/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Card } from '@client/src/components/ui/card';
import { useAppStore } from '@client/src/store/useAppStore';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { EVENTS } from '@client/src/data/events';
import { FIGURES } from '@client/src/data/figures';
import { ERAS, REGIONS, DIFFICULTY_LEVELS, formatYearRange } from '@client/src/data/eras';
import type { HistoryEvent, HistoricalFigure, Note, EraId, RegionId, Difficulty } from '@client/src/types/history';

type TabValue = 'all' | 'events' | 'figures' | 'notes';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { searchHistory, addSearchHistory, clearSearchHistory, difficulty } = useAppStore();
  const { notes } = useLearningStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterEra, setFilterEra] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = (q: string): void => {
    const trimmed = q.trim();
    if (!trimmed) return;
    addSearchHistory(trimmed);
    setSubmittedQuery(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const handleHistoryClick = (item: string): void => {
    setQuery(item);
    handleSearch(item);
  };

  const filteredEvents = useMemo((): HistoryEvent[] => {
    if (!submittedQuery) return [];
    const q = submittedQuery.toLowerCase();
    return EVENTS.filter((ev: HistoryEvent) => {
      const content = ev.content[difficulty];
      const matchesQuery =
        ev.title.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q) ||
        content.summary.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (filterEra !== 'all' && ev.era !== filterEra) return false;
      if (filterRegion !== 'all' && ev.region !== filterRegion) return false;
      if (filterDifficulty !== 'all' && !ev.content[filterDifficulty as Difficulty]) return false;
      return true;
    });
  }, [submittedQuery, filterEra, filterRegion, filterDifficulty, difficulty]);

  const filteredFigures = useMemo((): HistoricalFigure[] => {
    if (!submittedQuery) return [];
    const q = submittedQuery.toLowerCase();
    return FIGURES.filter((fig: HistoricalFigure) => {
      const content = fig.content[difficulty];
      const matchesQuery =
        fig.name.toLowerCase().includes(q) ||
        content.identity.toLowerCase().includes(q) ||
        content.bio.toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (filterEra !== 'all' && fig.era !== filterEra) return false;
      if (filterRegion !== 'all' && fig.region !== filterRegion) return false;
      return true;
    });
  }, [submittedQuery, filterEra, filterRegion, difficulty]);

  const filteredNotes = useMemo((): Note[] => {
    if (!submittedQuery) return [];
    const q = submittedQuery.toLowerCase();
    return notes.filter((n: Note) =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
    );
  }, [submittedQuery, notes]);

  const totalCount = filteredEvents.length + filteredFigures.length + filteredNotes.length;
  const hasSearched = submittedQuery.length > 0;
  const hasHistory = searchHistory.length > 0;

  const getEraName = (eraId: string): string =>
    ERAS.find((e) => e.id === eraId)?.name ?? eraId;
  const getRegionName = (regionId: string): string =>
    REGIONS.find((r) => r.id === regionId)?.name ?? regionId;
  const getRegionColor = (regionId: string): string =>
    REGIONS.find((r) => r.id === regionId)?.color ?? '#6B7280';

  return (
    <div className="space-y-6">
      {/* 顶部搜索栏 */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索历史事件、人物、笔记..."
            className="pl-10 pr-10 h-11 text-base"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSubmittedQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="清除"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button onClick={() => handleSearch(query)}>搜索</Button>
      </div>

      {/* 搜索历史 */}
      {!hasSearched && hasHistory && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="w-4 h-4 text-muted-foreground" />
              搜索历史
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearchHistory}
              className="text-muted-foreground hover:text-destructive h-7 px-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              清除
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item: string) => (
              <button
                key={item}
                onClick={() => handleHistoryClick(item)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm text-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Clock className="w-3 h-3 text-muted-foreground" />
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 空搜索首页提示 */}
      {!hasSearched && !hasHistory && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-serif font-semibold text-foreground mb-2">
            探索历史的海洋
          </h2>
          <p className="text-muted-foreground max-w-md">
            输入关键词，搜索历史事件、人物和你的学习笔记。
          </p>
        </div>
      )}

      {/* 搜索结果 */}
      {hasSearched && (
        <>
          {/* 结果统计 + 筛选 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              找到 <span className="font-semibold text-foreground">{totalCount}</span> 条关于 "
              <span className="text-primary">{submittedQuery}</span>" 的结果
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-fit"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? '收起筛选' : '高级筛选'}
            </Button>
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    时期
                  </label>
                  <Select value={filterEra} onValueChange={setFilterEra}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="全部时期" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部时期</SelectItem>
                      {ERAS.map((era) => (
                        <SelectItem key={era.id} value={era.id}>
                          {era.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    地区
                  </label>
                  <Select value={filterRegion} onValueChange={setFilterRegion}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="全部地区" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部地区</SelectItem>
                      {REGIONS.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    难度
                  </label>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="全部难度" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部难度</SelectItem>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}

          {/* 分类 Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v: string) => setActiveTab(v as TabValue)}
          >
            <TabsList>
              <TabsTrigger value="all">
                全部 <Badge variant="secondary" className="ml-1.5">{totalCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="events">
                事件 <Badge variant="secondary" className="ml-1.5">{filteredEvents.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="figures">
                人物 <Badge variant="secondary" className="ml-1.5">{filteredFigures.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="notes">
                笔记 <Badge variant="secondary" className="ml-1.5">{filteredNotes.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-6">
              {totalCount === 0 ? (
                <EmptyState query={submittedQuery} />
              ) : (
                <>
                  {filteredEvents.length > 0 && (
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        历史事件
                        <Badge variant="secondary">{filteredEvents.length}</Badge>
                      </h3>
                      <div className="space-y-3">
                        {filteredEvents.slice(0, 5).map((ev: HistoryEvent) => (
                          <EventCard
                            key={ev.id}
                            event={ev}
                            onClick={() => navigate(`/event/${ev.id}`)}
                            difficulty={difficulty}
                            getEraName={getEraName}
                            getRegionName={getRegionName}
                            getRegionColor={getRegionColor}
                          />
                        ))}
                      </div>
                      {filteredEvents.length > 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('events')}
                          className="w-full text-primary"
                        >
                          查看全部 {filteredEvents.length} 个事件 →
                        </Button>
                      )}
                    </section>
                  )}

                  {filteredFigures.length > 0 && (
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <UserRound className="w-4 h-4 text-primary" />
                        历史人物
                        <Badge variant="secondary">{filteredFigures.length}</Badge>
                      </h3>
                      <div className="space-y-3">
                        {filteredFigures.slice(0, 5).map((fig: HistoricalFigure) => (
                          <FigureCard
                            key={fig.id}
                            figure={fig}
                            onClick={() => navigate(`/figure/${fig.id}`)}
                            difficulty={difficulty}
                            getEraName={getEraName}
                            getRegionName={getRegionName}
                          />
                        ))}
                      </div>
                      {filteredFigures.length > 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('figures')}
                          className="w-full text-primary"
                        >
                          查看全部 {filteredFigures.length} 位人物 →
                        </Button>
                      )}
                    </section>
                  )}

                  {filteredNotes.length > 0 && (
                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <StickyNote className="w-4 h-4 text-primary" />
                        我的笔记
                        <Badge variant="secondary">{filteredNotes.length}</Badge>
                      </h3>
                      <div className="space-y-3">
                        {filteredNotes.slice(0, 5).map((note: Note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onClick={() => navigate(`/notes/edit/${note.id}`)}
                          />
                        ))}
                      </div>
                      {filteredNotes.length > 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('notes')}
                          className="w-full text-primary"
                        >
                          查看全部 {filteredNotes.length} 条笔记 →
                        </Button>
                      )}
                    </section>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="events" className="mt-4 space-y-3">
              {filteredEvents.length === 0 ? (
                <EmptyState query={submittedQuery} type="事件" />
              ) : (
                filteredEvents.map((ev: HistoryEvent) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    onClick={() => navigate(`/event/${ev.id}`)}
                    difficulty={difficulty}
                    getEraName={getEraName}
                    getRegionName={getRegionName}
                    getRegionColor={getRegionColor}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="figures" className="mt-4 space-y-3">
              {filteredFigures.length === 0 ? (
                <EmptyState query={submittedQuery} type="人物" />
              ) : (
                filteredFigures.map((fig: HistoricalFigure) => (
                  <FigureCard
                    key={fig.id}
                    figure={fig}
                    onClick={() => navigate(`/figure/${fig.id}`)}
                    difficulty={difficulty}
                    getEraName={getEraName}
                    getRegionName={getRegionName}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-4 space-y-3">
              {filteredNotes.length === 0 ? (
                <EmptyState query={submittedQuery} type="笔记" />
              ) : (
                filteredNotes.map((note: Note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => navigate(`/notes/edit/${note.id}`)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

// ===== 子组件 =====

interface EventCardProps {
  event: HistoryEvent;
  onClick: () => void;
  difficulty: Difficulty;
  getEraName: (id: string) => string;
  getRegionName: (id: string) => string;
  getRegionColor: (id: string) => string;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onClick,
  difficulty,
  getEraName,
  getRegionName,
  getRegionColor,
}) => {
  const content = event.content[difficulty];
  return (
    <Card
      onClick={onClick}
      className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-1 h-full min-h-[3rem] rounded-full shrink-0"
          style={{ backgroundColor: getRegionColor(event.region) }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="font-serif font-semibold text-foreground text-base">
              {event.title}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {getEraName(event.era)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getRegionName(event.region)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatYearRange(event.startYear, event.endYear)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {content.summary}
          </p>
        </div>
      </div>
    </Card>
  );
};

interface FigureCardProps {
  figure: HistoricalFigure;
  onClick: () => void;
  difficulty: Difficulty;
  getEraName: (id: string) => string;
  getRegionName: (id: string) => string;
}

const FigureCard: React.FC<FigureCardProps> = ({
  figure,
  onClick,
  difficulty,
  getEraName,
  getRegionName,
}) => {
  const content = figure.content[difficulty];
  const yearStr = `${figure.birthYear < 0 ? `前${Math.abs(figure.birthYear)}` : figure.birthYear} - ${
    figure.deathYear < 0 ? `前${Math.abs(figure.deathYear)}` : figure.deathYear
  }`;
  return (
    <Card
      onClick={onClick}
      className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <UserRound className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif font-semibold text-foreground text-base">
              {figure.name}
            </h3>
            <span className="text-xs text-muted-foreground">{yearStr}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {content.identity}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getEraName(figure.era)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getRegionName(figure.region)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {content.bio}
          </p>
        </div>
      </div>
    </Card>
  );
};

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
  return (
    <Card
      onClick={onClick}
      className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
          <StickyNote className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm mb-1">{note.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{note.content}</p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {new Date(note.updatedAt).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </div>
    </Card>
  );
};

interface EmptyStateProps {
  query: string;
  type?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ query, type }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 mb-4 rounded-full bg-muted flex items-center justify-center">
        <Inbox className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-serif font-semibold text-foreground mb-1">
        没有找到相关{type ?? '结果'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        没有关于「{query}」的{type ?? ''}匹配结果。试试换个关键词或调整筛选条件。
      </p>
    </div>
  );
};

export default SearchPage;
