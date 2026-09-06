import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Eye,
  EyeOff,
  StickyNote,
  User,
  BookOpen,
  Award,
  MessageSquare,
  Calendar,
  ScrollText,
} from 'lucide-react';
import { FIGURES } from '@client/src/data/figures';
import { EVENTS } from '@client/src/data/events';
import { formatYear } from '@client/src/data/eras';
import { useAppStore } from '@client/src/store/useAppStore';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { useStudyTimerPage } from '@client/src/hooks/useStudyTimer';
import type { Difficulty, HistoricalFigure, HistoryEvent } from '@client/src/types/history';
import DifficultySwitcher from '../EventDetail/DifficultySwitcher';
import EraRegionBadges from '../EventDetail/EraRegionBadges';
import EventCardSmall from '../EventDetail/EventCardSmall';
import FunFactsSection from '../EventDetail/FunFactsSection';

const SECTIONS = [
  { id: 'bio', label: '生平简介', icon: BookOpen },
  { id: 'achievements', label: '主要成就', icon: Award },
  { id: 'evaluation', label: '历史评价', icon: MessageSquare },
] as const;

const FigureDetailPage: React.FC = () => {
  useStudyTimerPage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const globalDifficulty = useAppStore((s) => s.difficulty);
  const setGlobalDifficulty = useAppStore((s) => s.setDifficulty);
  const [pageDifficulty, setPageDifficulty] = useState<Difficulty>(globalDifficulty);

  const {
    readFigures,
    favorites,
    markFigureRead,
    toggleFigureRead,
    toggleFavoriteFigure,
  } = useLearningStore();

  const figure: HistoricalFigure | undefined = useMemo(
    () => FIGURES.find((f: HistoricalFigure) => f.id === id),
    [id],
  );

  const isRead = figure ? readFigures.includes(figure.id) : false;
  const isFavorited = figure ? favorites.figures.includes(figure.id) : false;

  const relatedEvents: HistoryEvent[] = useMemo(() => {
    if (!figure) return [];
    const relatedIds = figure.content[pageDifficulty]?.relatedEventIds ?? [];
    return relatedIds
      .map((eid: string) => EVENTS.find((e: HistoryEvent) => e.id === eid))
      .filter((e): e is HistoryEvent => e !== undefined);
  }, [figure, pageDifficulty]);

  // 进入页面自动标记已读
  useEffect(() => {
    if (figure) {
      markFigureRead(figure.id);
    }
  }, [figure, markFigureRead]);

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

  // 找不到人物
  if (!figure) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
          未找到该人物
        </h1>
        <p className="text-base text-muted-foreground mb-8 max-w-md">
          您访问的历史人物不存在或已被移除。
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

  const content = figure.content[pageDifficulty];

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
              onClick={() => toggleFavoriteFigure(figure.id)}
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
              onClick={() => toggleFigureRead(figure.id)}
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

      {/* 人物信息区 */}
      <header className="pt-6 pb-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight">
              {figure.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatYear(figure.birthYear)} - {formatYear(figure.deathYear)}
              </span>
            </div>
            <EraRegionBadges era={figure.era} region={figure.region} />
          </div>
        </div>

        {/* 身份 */}
        <p className="text-base font-medium text-primary/90 bg-primary/5 rounded-lg px-4 py-2 inline-block">
          {content.identity}
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
            {content.funFacts && content.funFacts.length > 0 && (
              <button
                onClick={() => scrollToSection('fun-facts')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-lg transition-colors text-left"
              >
                <Award className="w-4 h-4" />
                趣味知识
              </button>
            )}
            {relatedEvents.length > 0 && (
              <button
                onClick={() => scrollToSection('related-events')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-lg transition-colors text-left"
              >
                <ScrollText className="w-4 h-4" />
                相关事件
              </button>
            )}
          </div>
        </aside>

        {/* 正文内容区 */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* 生平简介 */}
          <section id="bio" className="space-y-3 scroll-mt-28">
            <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              生平简介
            </h2>
            <div className="font-serif text-lg leading-loose text-foreground/90 whitespace-pre-line">
              {content.bio}
            </div>
          </section>

          {/* 主要成就 */}
          <section id="achievements" className="space-y-3 scroll-mt-28">
            <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              主要成就
            </h2>
            <div className="font-serif text-lg leading-loose text-foreground/90 whitespace-pre-line">
              {content.achievements}
            </div>
          </section>

          {/* 历史评价 */}
          <section id="evaluation" className="space-y-3 scroll-mt-28">
            <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              历史评价
            </h2>
            <div className="font-serif text-lg leading-loose text-foreground/90 whitespace-pre-line">
              {content.evaluation}
            </div>
          </section>

          {/* 趣味知识 */}
          {content.funFacts && content.funFacts.length > 0 && (
            <section id="fun-facts" className="scroll-mt-28">
              <FunFactsSection facts={content.funFacts} />
            </section>
          )}

          {/* 相关事件区 */}
          {relatedEvents.length > 0 && (
            <section
              id="related-events"
              className="space-y-4 -mx-4 sm:-mx-6 lg:-mx-0 px-4 sm:px-6 lg:px-0 scroll-mt-28"
            >
              <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-primary" />
                相关事件
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
            <Link
              to={`/notes/edit?figureId=${encodeURIComponent(figure.id)}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <StickyNote className="w-4 h-4" />
              添加笔记
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FigureDetailPage;
