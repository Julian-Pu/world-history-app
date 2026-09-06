import { Link } from 'react-router-dom';
import {
  Clock,
  Map,
  HelpCircle,
  XCircle,
  StickyNote,
  Star,
} from 'lucide-react';
import { useLearningStore } from '@client/src/store/useLearningStore';

interface QuickLink {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgClass: string;
  badge?: string;
}

const HomeQuickLinks: React.FC = () => {
  const { wrongQuestions, notes, favorites } = useLearningStore();

  const links: QuickLink[] = [
    {
      to: '/timeline',
      label: '时间线',
      icon: Clock,
      color: 'text-era-ancient',
      bgClass: 'bg-era-ancient/10',
    },
    {
      to: '/map',
      label: '历史地图',
      icon: Map,
      color: 'text-era-medieval',
      bgClass: 'bg-era-medieval/10',
    },
    {
      to: '/quiz',
      label: '测验中心',
      icon: HelpCircle,
      color: 'text-era-industrial',
      bgClass: 'bg-era-industrial/10',
    },
    {
      to: '/quiz/wrong',
      label: '错题本',
      icon: XCircle,
      color: 'text-accent',
      bgClass: 'bg-accent/10',
      badge: wrongQuestions.length > 0 ? `${wrongQuestions.length}` : undefined,
    },
    {
      to: '/notes',
      label: '学习笔记',
      icon: StickyNote,
      color: 'text-era-early-modern',
      bgClass: 'bg-era-early-modern/10',
      badge: notes.length > 0 ? `${notes.length}` : undefined,
    },
    {
      to: '/profile',
      label: '我的收藏',
      icon: Star,
      color: 'text-era-modern',
      bgClass: 'bg-era-modern/10',
      badge: favorites.events.length + favorites.figures.length > 0
        ? `${favorites.events.length + favorites.figures.length}`
        : undefined,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
        <Star className="w-5 h-5 text-primary" />
        快捷入口
      </h2>

      <div className="grid grid-cols-3 gap-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="group flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 hover-elevate active-elevate relative"
            >
              {link.badge && (
                <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                  {link.badge}
                </span>
              )}
              <div className={`w-10 h-10 rounded-full ${link.bgClass} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${link.color}`} />
              </div>
              <span className="text-xs font-medium text-foreground text-center">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default HomeQuickLinks;
