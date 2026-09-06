import { Flame, Cloud, HardDrive, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@client/src/store/useAppStore';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { Button } from '@/components/ui/button';

const ProfileHeader: React.FC = () => {
  const navigate = useNavigate();
  const { storageMode, currentUser } = useAppStore();
  const { streakDays, totalStudyMinutes } = useLearningStore();

  const isLoggedIn = !!currentUser;
  const userName = currentUser?.username || '历史学习者';

  const handleAvatarClick = () => {
    if (!isLoggedIn) {
      navigate('/auth');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-border shadow-sm">
      {/* 头像 */}
      <div
        className={`relative shrink-0 ${!isLoggedIn ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
        onClick={handleAvatarClick}
        role={!isLoggedIn ? 'button' : undefined}
        tabIndex={!isLoggedIn ? 0 : undefined}
        onKeyDown={!isLoggedIn ? (e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/auth'); } : undefined}
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-card shadow-md">
          <span className="text-4xl sm:text-5xl">📜</span>
        </div>
        {!isLoggedIn && (
          <div className="absolute -bottom-1 -right-1 bg-muted px-2 py-0.5 rounded-full text-xs text-muted-foreground border border-border">
            未登录
          </div>
        )}
      </div>

      {/* 用户信息 */}
      <div className="flex-1 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
          {isLoggedIn ? userName : '欢迎来到历史世界'}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mb-4">
          {isLoggedIn
            ? `累计学习 ${Math.floor(totalStudyMinutes / 60)} 小时，继续加油！`
            : '登录后可同步学习数据到云端，永不丢失'}
        </p>

        {/* 未登录时显示登录按钮 */}
        {!isLoggedIn && (
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
            <Button
              onClick={() => navigate('/auth')}
              className="gap-2"
            >
              <LogIn className="w-4 h-4" />
              登录 / 注册
            </Button>
            <span className="text-xs text-muted-foreground">点击头像也可进入</span>
          </div>
        )}

        {/* 连续学习天数 */}
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-400/20 to-amber-500/20 border border-orange-300/30">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-400" />
            <span className="font-bold text-orange-700 dark:text-orange-400">
              {streakDays}
            </span>
            <span className="text-xs text-orange-600/80 dark:text-orange-400/80">
              天连续
            </span>
          </div>

          {/* 存储模式标签 */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border">
            {storageMode === 'cloud' ? (
              <Cloud className="w-4 h-4 text-primary" />
            ) : (
              <HardDrive className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">
              {storageMode === 'cloud' ? '云端存储' : '本地存储'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
