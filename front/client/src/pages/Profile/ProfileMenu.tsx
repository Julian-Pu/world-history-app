import { useNavigate } from 'react-router-dom';
import {
  Star,
  StickyNote,
  BookX,
  Settings,
  ChevronRight,
  Users,
  Calendar,
} from 'lucide-react';
import { useLearningStore } from '@client/src/store/useLearningStore';

interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  count?: number;
  to: string;
  accentColor: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon: Icon,
  label,
  description,
  count,
  to,
  accentColor,
}) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-200 text-left group"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
      >
        <Icon className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{label}</h3>
          {count !== undefined && count > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-primary/10 text-primary">
              {count}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>

      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
};

const ProfileMenu: React.FC = () => {
  const { favorites, notes, wrongQuestions } = useLearningStore();

  const totalFavorites = favorites.events.length + favorites.figures.length;

  const menuItems: MenuItemProps[] = [
    {
      icon: Star,
      label: '我的收藏',
      description:
        totalFavorites > 0
          ? `${favorites.events.length} 个事件 · ${favorites.figures.length} 位人物`
          : '收藏感兴趣的历史事件和人物',
      count: totalFavorites,
      to: '/favorites',
      accentColor: 'hsl(45, 89%, 38%)',
    },
    {
      icon: StickyNote,
      label: '我的笔记',
      description:
        notes.length > 0
          ? `最新：${notes[0]?.title || '暂无'}`
          : '记录你的学习心得和感悟',
      count: notes.length,
      to: '/notes',
      accentColor: 'hsl(30, 76%, 31%)',
    },
    {
      icon: BookX,
      label: '错题本',
      description:
        wrongQuestions.length > 0
          ? `${wrongQuestions.length} 道待复习`
          : '复习答错的题目，查漏补缺',
      count: wrongQuestions.length,
      to: '/wrong-book',
      accentColor: 'hsl(0, 56%, 58%)',
    },
    {
      icon: Settings,
      label: '设置',
      description: '难度、主题、字体、存储等个性化设置',
      to: '/settings',
      accentColor: 'hsl(24, 15%, 36%)',
    },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-card border border-border shadow-sm">
      <h2 className="text-lg font-serif font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-primary rounded-full"></span>
        功能入口
      </h2>

      <div className="space-y-3">
        {menuItems.map((item) => (
          <MenuItem key={item.label} {...item} />
        ))}
      </div>

      {/* 底部小提示 */}
      <div className="mt-5 pt-4 border-t border-border flex items-center gap-3 text-sm text-muted-foreground">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4 text-primary" />
        </div>
        <p>
          每天坚持学习历史，解锁更多成就徽章！
        </p>
      </div>
    </div>
  );
};

export default ProfileMenu;
