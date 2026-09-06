import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  ArrowLeft,
  BookOpen,
  Sun,
  Moon,
  Type,
  Database,
  Cloud,
  User,
  LogOut,
  Download,
  Upload,
  Trash2,
  Info,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Switch } from '@client/src/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@client/src/components/ui/dialog';
import {
  RadioGroup,
  RadioGroupItem,
} from '@client/src/components/ui/radio-group';
import { Label } from '@client/src/components/ui/label';
import { Separator } from '@client/src/components/ui/separator';
import { Badge } from '@client/src/components/ui/badge';
import { useAppStore } from '@client/src/store/useAppStore';
import { useLearningStore } from '@client/src/store/useLearningStore';
import { DIFFICULTY_LEVELS } from '@client/src/data/eras';
import type { Difficulty } from '@client/src/types/history';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    difficulty,
    theme,
    fontSize,
    storageMode,
    currentUser,
    setDifficulty,
    setTheme,
    setFontSize,
    setStorageMode,
    setCurrentUser,
  } = useAppStore();
  const learningData = useLearningStore();
  const loadFromCloud = useLearningStore((state) => state.loadFromCloud);
  const syncAll = useLearningStore((state) => state.syncAll);
  const importData = useLearningStore((state) => state.importData);

  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState('');
  const [clearScope, setClearScope] = useState<'local' | 'cloud' | 'all'>('local');
  const [clearTypes, setClearTypes] = useState<string[]>(['all']);
  const [clearing, setClearing] = useState(false);

  // 可清除的数据类型
  const CLEARABLE_TYPES = [
    { id: 'progress', name: '学习进度', desc: '已读事件和人物记录' },
    { id: 'favorites', name: '收藏', desc: '收藏的事件和人物' },
    { id: 'notes', name: '学习笔记', desc: '所有笔记内容' },
    { id: 'quizRecords', name: '测验记录', desc: '测验完成记录和成绩' },
    { id: 'wrongQuestions', name: '错题本', desc: '收藏的错题' },
    { id: 'achievements', name: '成就徽章', desc: '已解锁的成就' },
    { id: 'studyTime', name: '学习时长', desc: '学习时长统计和连续天数' },
  ];

  // 从 store 获取登录状态
  const userLoggedIn = !!currentUser;

  const difficultyLabel = DIFFICULTY_LEVELS.find(
    (d) => d.id === difficulty,
  )?.name ?? difficulty;

  const fontSizeLabel: Record<'small' | 'medium' | 'large', string> = {
    small: '小',
    medium: '中',
    large: '大',
  };

  const handleStorageModeChange = (mode: 'local' | 'cloud'): void => {
    if (mode === 'cloud' && !userLoggedIn) {
      // 提示需要登录
      navigate('/auth');
      return;
    }
    setStorageMode(mode);
  };

  const handleSync = async (): Promise<void> => {
    if (storageMode === 'cloud' && !userLoggedIn) {
      navigate('/auth');
      return;
    }
    setSyncStatus('syncing');
    try {
      // 完整同步：先推送本地数据到云端，再从云端拉取合并
      await syncAll();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (e) {
      console.error('同步失败:', e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const handleExport = (): void => {
    const data = {
      readEvents: learningData.readEvents,
      readFigures: learningData.readFigures,
      favorites: learningData.favorites,
      notes: learningData.notes,
      quizRecords: learningData.quizRecords,
      wrongQuestions: learningData.wrongQuestions,
      achievements: learningData.achievements,
      studyCalendar: learningData.studyCalendar,
      totalStudyMinutes: learningData.totalStudyMinutes,
      streakDays: learningData.streakDays,
      lastStudyDate: learningData.lastStudyDate,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `history-learning-data-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        // 验证数据格式
        if (!data || typeof data !== 'object') {
          throw new Error('文件格式不正确');
        }

        // 构建合法的学习数据对象
        const importDataObj = {
          readEvents: Array.isArray(data.readEvents) ? data.readEvents : [],
          readFigures: Array.isArray(data.readFigures) ? data.readFigures : [],
          favorites: data.favorites && typeof data.favorites === 'object'
            ? {
                events: Array.isArray(data.favorites.events) ? data.favorites.events : [],
                figures: Array.isArray(data.favorites.figures) ? data.favorites.figures : [],
              }
            : { events: [], figures: [] },
          notes: Array.isArray(data.notes) ? data.notes : [],
          quizRecords: Array.isArray(data.quizRecords) ? data.quizRecords : [],
          wrongQuestions: Array.isArray(data.wrongQuestions) ? data.wrongQuestions : [],
          achievements: Array.isArray(data.achievements) ? data.achievements : [],
          studyCalendar: data.studyCalendar && typeof data.studyCalendar === 'object' ? data.studyCalendar : {},
          totalStudyMinutes: typeof data.totalStudyMinutes === 'number' ? data.totalStudyMinutes : 0,
          streakDays: typeof data.streakDays === 'number' ? data.streakDays : 0,
          lastStudyDate: typeof data.lastStudyDate === 'string' ? data.lastStudyDate : '',
        };

        importData(importDataObj);
        setShowImportDialog(false);
        setImportError('');
        // 重置文件输入
        if (e.target) e.target.value = '';
      } catch (err) {
        setImportError(err instanceof Error ? err.message : '导入失败，请检查文件格式');
      }
    };
    reader.onerror = () => {
      setImportError('文件读取失败');
    };
    reader.readAsText(file);
  };

  const handleClearData = async (): Promise<void> => {
    setClearing(true);
    try {
      const shouldClear = (type: string) => clearTypes.includes('all') || clearTypes.includes(type);

      // 清除本地数据
      if (clearScope === 'local' || clearScope === 'all') {
        const updates: any = {};
        if (shouldClear('progress')) {
          updates.readEvents = [];
          updates.readFigures = [];
        }
        if (shouldClear('favorites')) {
          updates.favorites = { events: [], figures: [] };
        }
        if (shouldClear('notes')) {
          updates.notes = [];
        }
        if (shouldClear('quizRecords')) {
          updates.quizRecords = [];
        }
        if (shouldClear('wrongQuestions')) {
          updates.wrongQuestions = [];
        }
        if (shouldClear('achievements')) {
          updates.achievements = [];
        }
        if (shouldClear('studyTime')) {
          updates.totalStudyMinutes = 0;
          updates.streakDays = 0;
          updates.studyCalendar = {};
          updates.lastStudyDate = '';
        }
        if (Object.keys(updates).length > 0) {
          useLearningStore.setState(updates);
        }
      }

      // 清除云端数据
      if ((clearScope === 'cloud' || clearScope === 'all') && userLoggedIn) {
        try {
          const token = localStorage.getItem('history-app-token');
          await fetch('/api/data/clear', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              types: clearTypes.includes('all') ? CLEARABLE_TYPES.map(t => t.id) : clearTypes,
            }),
          });
        } catch (e) {
          console.error('清除云端数据失败:', e);
        }
      }

      setShowClearDialog(false);
      setClearTypes(['all']);
      setClearScope('local');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部 */}
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
        <h1 className="text-2xl font-serif font-bold text-foreground">设置</h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* 难度设置 */}
        <section className="rounded-xl border bg-card border-card-border overflow-hidden">
          <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setShowDifficultyDialog(true)}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground text-sm">难度等级</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  当前：{difficultyLabel}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{difficultyLabel}</Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <Separator />
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-primary" />
                ) : (
                  <Sun className="w-4 h-4 text-primary" />
                )}
              </div>
              <div>
                <div className="font-medium text-foreground text-sm">深色主题</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {theme === 'dark' ? '已开启深色模式' : '使用浅色模式'}
                </div>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked: boolean) =>
                setTheme(checked ? 'dark' : 'light')
              }
              aria-label="切换主题"
            />
          </div>
          <Separator />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Type className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground text-sm">字体大小</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    调整正文文字大小
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 ml-12">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
                    fontSize === size
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {fontSizeLabel[size]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 存储与同步 */}
        <section className="rounded-xl border bg-card border-card-border overflow-hidden">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-primary" />
              存储与同步
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              管理学习数据的存储方式和同步设置
            </p>
          </div>
          <Separator />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium text-foreground text-sm">存储模式</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleStorageModeChange('local')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  storageMode === 'local'
                    ? 'bg-primary/10 border-primary text-foreground'
                    : 'bg-background border-border text-foreground hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">本地保存</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  数据保存在本机，无需登录
                </p>
              </button>
              <button
                onClick={() => handleStorageModeChange('cloud')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  storageMode === 'cloud'
                    ? 'bg-primary/10 border-primary text-foreground'
                    : 'bg-background border-border text-foreground hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Cloud className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">云端同步</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {userLoggedIn ? '多设备实时同步' : '需要登录账号'}
                </p>
              </button>
            </div>
            {storageMode === 'cloud' && !userLoggedIn && (
              <p className="text-xs text-destructive mt-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                云端同步需要先登录账号
              </p>
            )}
          </div>
          <Separator />
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-foreground text-sm">手动同步</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {syncStatus === 'idle' && '立即同步本地与云端数据'}
                {syncStatus === 'syncing' && '正在同步...'}
                {syncStatus === 'success' && '同步完成 ✓'}
                {syncStatus === 'error' && '同步失败，请重试'}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncStatus === 'syncing'}
            >
              <RefreshCw
                className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
              />
              同步
            </Button>
          </div>
        </section>

        {/* 账号管理 */}
        <section className="rounded-xl border bg-card border-card-border overflow-hidden">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-primary" />
              账号管理
            </h2>
            <p className="text-xs text-muted-foreground">
              {userLoggedIn ? '管理你的账号信息' : '登录以同步学习数据'}
            </p>
          </div>
          <Separator />
          {userLoggedIn ? (
            <>
              <div className="p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground text-sm">{currentUser?.username || '用户'}</div>
                  <div className="text-xs text-muted-foreground">{currentUser?.email || ''}</div>
                </div>
                <Badge variant="secondary">已登录</Badge>
              </div>
              <Separator />
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                onClick={() => {}}
              >
                <span className="text-sm text-foreground">修改密码</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <Separator />
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-destructive/5 transition-colors text-left"
                onClick={() => {
                  // 清除用户信息和token，但保留存储模式设置
                  setCurrentUser(null);
                  localStorage.removeItem('history-app-token');
                }}
              >
                <span className="text-sm text-destructive flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  退出登录
                </span>
              </button>
            </>
          ) : (
            <div className="p-4">
              <Button onClick={() => navigate('/auth')} className="w-full">
                <User className="w-4 h-4" />
                登录 / 注册
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                登录后可同步学习进度、笔记和成就
              </p>
            </div>
          )}
        </section>

        {/* 数据管理 */}
        <section className="rounded-xl border bg-card border-card-border overflow-hidden">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-primary" />
              数据管理
            </h2>
            <p className="text-xs text-muted-foreground">
              导出、导入或清除本地学习数据
            </p>
          </div>
          <Separator />
          <button
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
            onClick={handleExport}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-green-50 flex items-center justify-center">
                <Download className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-foreground text-sm">导出学习数据</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  下载为 JSON 文件备份
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <Separator />
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-sm">导入学习数据</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      从 JSON 备份文件恢复学习数据
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>导入学习数据</DialogTitle>
                <DialogDescription>
                  选择之前导出的 JSON 备份文件，将恢复学习记录、笔记、收藏、测验记录等数据。
                  导入将覆盖当前本地数据。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">点击选择 JSON 文件</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleImportFile}
                  />
                </label>
                {importError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0" />
                      {importError}
                    </p>
                  </div>
                )}
                <div className="bg-muted/50 border border-border rounded-md p-3">
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    导入操作将覆盖当前所有本地学习数据，建议先导出备份。此操作仅影响本地数据，不会自动同步到云端。
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowImportDialog(false); setImportError(''); }}>
                  取消
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Separator />
          <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <DialogTrigger asChild>
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-destructive/5 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <div className="font-medium text-destructive text-sm">
                      清除所有数据
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      删除本地所有学习记录和笔记
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>清除学习数据</DialogTitle>
                <DialogDescription>
                  选择清除范围和数据类型，此操作不可撤销。
                </DialogDescription>
              </DialogHeader>

              {/* 清除范围 */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">清除范围</div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'local', name: '仅本地', desc: '只清除本机数据' },
                    { id: 'cloud', name: '仅云端', desc: '只清除服务器数据' },
                    { id: 'all', name: '全部清除', desc: '本地和云端都清除' },
                  ] as const).map((scope) => (
                    <button
                      key={scope.id}
                      onClick={() => setClearScope(scope.id)}
                      disabled={scope.id === 'cloud' && !userLoggedIn}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        clearScope === scope.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      } ${scope.id === 'cloud' && !userLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="font-medium text-sm text-foreground">{scope.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{scope.desc}</div>
                    </button>
                  ))}
                </div>
                {clearScope === 'cloud' && !userLoggedIn && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    清除云端数据需要先登录
                  </p>
                )}
              </div>

              {/* 数据类型选择 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">清除内容</div>
                  <button
                    onClick={() => setClearTypes(clearTypes.includes('all') ? [] : ['all'])}
                    className="text-xs text-primary hover:underline"
                  >
                    {clearTypes.includes('all') ? '取消全选' : '全选'}
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearTypes.includes('all')}
                      onChange={(e) => setClearTypes(e.target.checked ? ['all'] : [])}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="text-sm font-medium text-foreground">全部数据</div>
                      <div className="text-xs text-muted-foreground">清除所有学习相关数据</div>
                    </div>
                  </label>
                  <Separator />
                  {CLEARABLE_TYPES.map((type) => (
                    <label
                      key={type.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={clearTypes.includes(type.id)}
                        disabled={clearTypes.includes('all')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setClearTypes([...clearTypes.filter(t => t !== 'all'), type.id]);
                          } else {
                            setClearTypes(clearTypes.filter(t => t !== type.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <div>
                        <div className="text-sm font-medium text-foreground">{type.name}</div>
                        <div className="text-xs text-muted-foreground">{type.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm text-destructive flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  已清除的数据无法恢复，建议先导出备份。
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowClearDialog(false)} disabled={clearing}>
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearData}
                  disabled={clearing || clearTypes.length === 0}
                >
                  {clearing ? '清除中...' : '确认清除'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        {/* 关于 */}
        <section className="rounded-xl border bg-card border-card-border overflow-hidden">
          <div className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground text-sm">关于应用</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                世界历史学习应用 v1.0.0
              </div>
            </div>
          </div>
          <Separator />
          <div className="p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              一款面向全年龄段的世界历史学习平台，支持分级内容、交互式时间线、历史地图、
              互动测验、学习笔记和成就系统。让每一个人都能在历史的长河中找到属于自己的乐趣。
            </p>
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground pb-4">
          © 2024 世界历史学习应用 · 用心制作
        </p>
      </div>

      {/* 难度选择对话框 */}
      <Dialog open={showDifficultyDialog} onOpenChange={setShowDifficultyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择难度等级</DialogTitle>
            <DialogDescription>
              选择适合你的历史知识深度，内容会根据难度自动调整。
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={difficulty}
            onValueChange={(val: string) => {
              setDifficulty(val as Difficulty);
              setShowDifficultyDialog(false);
            }}
            className="space-y-2"
          >
            {DIFFICULTY_LEVELS.map((level) => (
              <div key={level.id}>
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    difficulty === level.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={level.id} id={level.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="font-medium text-foreground text-sm">
                      {level.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {level.description}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDifficultyDialog(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
