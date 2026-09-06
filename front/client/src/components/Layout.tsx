import { NavLink, Outlet } from 'react-router-dom';
import {
  Home,
  Clock,
  Map,
  HelpCircle,
  StickyNote,
  UserCircle,
  Search,
  BookOpen,
  Network,
} from 'lucide-react';
import { useAppStore } from '@client/src/store/useAppStore';
import StudyTimerBadge from './StudyTimerBadge';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const desktopNavItems: NavItem[] = [
  { to: '/', label: '首页', icon: Home },
  { to: '/timeline', label: '时间线', icon: Clock },
  { to: '/map', label: '历史地图', icon: Map },
  { to: '/person-network', label: '人物关系', icon: Network },
  { to: '/quiz', label: '测验', icon: HelpCircle },
  { to: '/notes', label: '笔记', icon: StickyNote },
  { to: '/profile', label: '我的', icon: UserCircle },
  { to: '/search', label: '搜索', icon: Search },
];

const mobileNavItems: NavItem[] = [
  { to: '/', label: '首页', icon: Home },
  { to: '/timeline', label: '时间线', icon: Clock },
  { to: '/person-network', label: '人物关系', icon: Network },
  { to: '/quiz', label: '测验', icon: HelpCircle },
  { to: '/profile', label: '我的', icon: UserCircle },
];

const getFontSizeClass = (size: 'small' | 'medium' | 'large'): string => {
  switch (size) {
    case 'small':
      return 'text-sm';
    case 'large':
      return 'text-lg';
    default:
      return 'text-base';
  }
};

const Layout: React.FC = () => {
  const { fontSize } = useAppStore();
  const fontSizeClass = getFontSizeClass(fontSize);

  return (
    <div
      className={`min-h-screen bg-background text-foreground flex flex-col ${fontSizeClass}`}
    >
      {/* 桌面端顶部导航 (lg 及以上) */}
      <header className="hidden lg:block sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-serif font-bold text-xl text-foreground">
              世界历史
            </span>
          </NavLink>

          {/* 导航菜单 */}
          <nav className="flex items-center gap-1">
            <StudyTimerBadge />
            <span className="w-px h-6 bg-border mx-2" />
            {desktopNavItems.map((item: NavItem) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 hover-elevate active-elevate ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 移动端顶部标题栏 */}
      <header className="lg:hidden sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="w-20" />
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif font-bold text-lg text-foreground">
              世界历史
            </span>
          </NavLink>
          <div className="w-20 flex justify-end">
            <StudyTimerBadge />
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
        <Outlet />
      </main>

      {/* 移动端底部导航 (lg 以下) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item: NavItem) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-lg transition-colors hover-elevate active-elevate ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
        {/* 安全区域 */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
};

export default Layout;
