import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Eye,
  EyeOff,
  MapPin,
  StickyNote,
  BookOpen,
  ScrollText,
  Zap,
  Trophy,
} from 'lucide-react';
import { EVENTS } from '@client/src/data/events';
import { FIGURES } from '@client/src/data/figures';
import { formatYearRange } from '@client/src/data/eras';
import { useAppStore } from '@client/src/store/useAppStore';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { useStudyTimerPage } from '@client/src/hooks/useStudyTimer';
import type { Difficulty, HistoryEvent, HistoricalFigure } from '@client/src/types/history';
import DifficultySwitcher from './DifficultySwitcher';
import EraRegionBadges from './EraRegionBadges';
import EventCardSmall from './EventCardSmall';
import FigureCard from './FigureCard';
import FunFactsSection from './FunFactsSection';

const SECTIONS = [
  { id: 'background', label: '历史背景', icon: BookOpen },
  { id: 'process', label: '事件经过', icon: ScrollText },
  { id: 'impact', label: '历史影响', icon: Zap },
] as const;

const EventDetailPage: React.FC = () => {
  useStudyTimerPage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const globalDifficulty = useAppStore((s) => s.difficulty);
  const setGlobalDifficulty = useAppStore((s) => s.setDifficulty);
  const [pageDifficulty, setPageDifficulty] = useState<Difficulty>(globalDifficulty);

  const {
    readEvents,
    favorites,
    markEventRead,
    toggleEventRead,
    toggleFavoriteEvent,
  } = useLearningStore();

  const event: HistoryEvent | undefined = useMemo(
    () => EVENTS.find((e: HistoryEvent) => e.id === id),
    [id],
  );

  const isRead = event ? readEvents.includes(event.id) : false;
  const isFavorited = event ? favorites.events.includes(event.id) : false;

  const keyFigures: HistoricalFigure[] = useMemo(() => {
    if (!event) return [];
    return event.keyFigureIds
      .map((fid: string) => FIGURES.find((f: HistoricalFigure) => f.id === fid))
      .filter((f): f is HistoricalFigure => f !== undefined);
  }, [event]);

  const relatedEvents: HistoryEvent[] = useMemo(() => {
    if (!event) return [];
    const relatedIds = event.content[pageDifficulty]?.relatedEventIds ?? [];
    return relatedIds
      .map((eid: string) => EVENTS.find((e: HistoryEvent) => e.id === eid))
      .filter((e): e is HistoryEvent => e !== undefined && e.id !== event.id);
  }, [event, pageDifficulty]);

  // 进入页面自动标记已读
  useEffect(() => {
    if (event) {
      markEventRead(event.id);
    }
  }, [event, markEventRead]);

  // 同步全局难度
  useEffect(() => {
    setPageDifficulty(globalDifficulty);
  }, [globalDifficulty]);

  const handleDifficultyChange = (d: Difficulty) => {
    setPageDifficulty(d);
    setGlobalDifficulty(d);
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 找不到事件
  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
          未找到该事件
        </h1>
        <p className="text-base text-muted-foreground mb-8 max-w-md">
          您访问的历史事件不存在或已被移除。
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    );
  }

  const content = event.content[pageDifficulty];

  return (
    <div className="max-w-4xl mx-auto">
      {/* 顶部导航区 */}
      <div className="sticky top-14 lg:top-16 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex justify-center overflow-x-auto">
            <DifficultySwitcher
              value={pageDifficulty}
              onChange={handleDifficultyChange}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => toggleFavoriteEvent(event.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                isFavorited
                  ? 'text-amber-500 scale-110'
                  : 'text-muted-foreground hover:text-amber-500 hover:bg-secondary'
              }`}
              aria-label={isFavorited ? '取消收藏' : '收藏'}
            >
              <Star
                className="w-5 h-5 transition-transform"
                fill={isFavorited ? 'currentColor' : 'none'}
              />
            </button>
            <button
              onClick={() => toggleEventRead(event.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isRead
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
              aria-label={isRead ? '标记为未读' : '标记为已读'}
            >
              {isRead ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 标题区 */}
      <header className="pt-6 pb-6 space-y-4">
        <EraRegionBadges era={event.era} region={event.region} />

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight">
          {event.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ScrollText className="w-4 h-4" />
            {formatYearRange(event.startYear, event.endYear)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {event.location}
          </span>
          {isRead && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
              <Eye className="w-3 h-3" />
              已读
            </span>
          )}
        </div>

        {/* 摘要 */}
        <p className="text-lg text-foreground/80 font-serif leading-relaxed border-l-4 border-primary pl-4 italic">
          {content.summary}
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 桌面端侧边目录 */}
        <aside className="hidden lg:block lg:w-56 shrink-0">
          <div className="sticky top-32 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
              目录
            </p>
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-lg transition-colors text-left"
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
            <button
              onClick={() => scrollToSection('fun-facts')}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-lg transition-colors text-left"
            >
              <Trophy className="w-4 h-4" />
              趣味知识
            </button>
            {keyFigures.length > 0 && (
              <button
                onClick={() => scrollToSection('key-figures')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-lg transition-colors text-left"
              >
                <BookOpen className="w-4 h-4" />
                关键人物
              </button>
            )}
          </div>
        </aside>

        {/* 正文内容区 */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* 历史背景 */}
          <section id="background" className="space-y-3 scroll-mt-28">
            <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              历史背景
            </h2>
            <div className="font-serif text-lg leading-loose text-foreground/90 whitespace-pre-line">
              {content.background}
            </div>
          </section>

          {/* 事件经过 */}
          <section id="process" className="space-y-3 scroll-mt-28">
            <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-primary" />
              事件经过
            </h2>
            <div className="font-serif text-lg leading-loose text-foreground/90 whitespace-pre-line">
              {content.process}
            </div>
          </section>

          {/* 历史影响 */}
          <section id="impact" className="space-y-3 scroll-mt-28">
            <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              历史影响
            </h2>
            <div className="font-serif text-lg leading-loose text-foreground/90 whitespace-pre-line">
              {content.impact}
            </div>
          </section>

          {/* 趣味知识 */}
          {content.funFacts && content.funFacts.length > 0 && (
            <section id="fun-facts" className="scroll-mt-28">
              <FunFactsSection facts={content.funFacts} />
            </section>
          )}

          {/* 关键人物区 */}
          {keyFigures.length > 0 && (
            <section id="key-figures" className="space-y-4 scroll-mt-28">
              <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                关键人物
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {keyFigures.map((figure: HistoricalFigure) => (
                  <FigureCard key={figure.id} figure={figure} />
                ))}
              </div>
            </section>
          )}

          {/* 关联事件区 */}
          {relatedEvents.length > 0 && (
            <section className="space-y-4 -mx-4 sm:-mx-6 lg:-mx-0 px-4 sm:px-6 lg:px-0">
              <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-primary" />
                关联事件
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
                {relatedEvents.map((ev: HistoryEvent) => (
                  <EventCardSmall key={ev.id} event={ev} />
                ))}
              </div>
            </section>
          )}

          {/* 笔记入口区 */}
          <section className="pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={`/notes/edit?eventId=${encodeURIComponent(event.id)}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <StickyNote className="w-4 h-4" />
                添加笔记
              </Link>
              <Link
                to={`/map?eventId=${encodeURIComponent(event.id)}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-secondary/50 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                在地图上查看
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
