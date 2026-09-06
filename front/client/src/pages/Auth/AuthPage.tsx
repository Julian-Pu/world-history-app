import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  BookOpen,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@client/src/store/useAppStore';
import { useLearningStore } from '@client/src/store/useLearningStore';
import {
  authValidators,
} from '@client/src/utils/auth';
import { authApi } from '@client/src/utils/api';
import { toast } from 'sonner';

type TabValue = 'login' | 'register';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const setStorageMode = useAppStore((state) => state.setStorageMode);
  const loadFromCloud = useLearningStore((state) => state.loadFromCloud);

  const [activeTab, setActiveTab] = useState<TabValue>('login');

  // 登录表单
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});
  const [loginLoading, setLoginLoading] = useState(false);

  // 注册表单
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regErrors, setRegErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [regLoading, setRegLoading] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof loginErrors = {};
    if (!loginIdentifier.trim()) {
      errors.identifier = '请输入用户名或邮箱';
    }
    const pwError = authValidators.password(loginPassword);
    if (pwError) errors.password = pwError;

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }

    setLoginLoading(true);
    try {
      // 调用后端登录API（authApi会自动提取data.data）
      const result = await authApi.login(loginIdentifier.trim(), loginPassword);

      // 保存token
      if (result.token) {
        localStorage.setItem('history-app-token', result.token);
      }

      // 转换后端用户信息为前端格式
      const backendUser = result.user;
      const publicUser = {
        id: backendUser.id,
        username: backendUser.username,
        email: backendUser.email,
        defaultLevel: backendUser.default_level || backendUser.defaultLevel,
        storageMode: backendUser.storage_mode || backendUser.storageMode,
        createdAt: backendUser.created_at || backendUser.createdAt,
      };

      setCurrentUser(publicUser);
      setStorageMode('cloud');
      toast.success('登录成功', {
        description: `欢迎回来，${publicUser.username}`,
      });
      navigate('/', { replace: true });
      // 后台异步加载云端数据，不阻塞登录流程
      setTimeout(() => {
        loadFromCloud().catch(e => console.error('加载云端数据失败:', e));
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败';
      setLoginErrors({ password: message });
      toast.error('登录失败', { description: message });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof regErrors = {};
    const usernameErr = authValidators.username(regUsername);
    if (usernameErr) errors.username = usernameErr;
    const emailErr = authValidators.email(regEmail);
    if (emailErr) errors.email = emailErr;
    const pwErr = authValidators.password(regPassword);
    if (pwErr) errors.password = pwErr;
    const confirmErr = authValidators.confirmPassword(
      regPassword,
      regConfirmPassword,
    );
    if (confirmErr) errors.confirmPassword = confirmErr;

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }

    setRegLoading(true);
    try {
      // 调用后端注册API（authApi会自动提取data.data）
      const result = await authApi.register(
        regUsername.trim(),
        regEmail.trim(),
        regPassword,
      );

      // 保存token
      if (result.token) {
        localStorage.setItem('history-app-token', result.token);
      }

      // 转换后端用户信息为前端格式
      const backendUser = result.user;
      const publicUser = {
        id: backendUser.id,
        username: backendUser.username,
        email: backendUser.email,
        defaultLevel: backendUser.default_level || backendUser.defaultLevel,
        storageMode: backendUser.storage_mode || backendUser.storageMode,
        createdAt: backendUser.created_at || backendUser.createdAt,
      };

      setCurrentUser(publicUser);
      setStorageMode('cloud');
      toast.success('注册成功', {
        description: `欢迎加入，${publicUser.username}`,
      });
      navigate('/', { replace: true });
      // 后台异步加载云端数据
      setTimeout(() => {
        loadFromCloud().catch(e => console.error('加载云端数据失败:', e));
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败';
      if (message.includes('用户名')) {
        setRegErrors({ username: message });
      } else if (message.includes('邮箱')) {
        setRegErrors({ email: message });
      } else {
        setRegErrors({ password: message });
      }
      toast.error('注册失败', { description: message });
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4">
      {/* 装饰背景 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* 返回按钮 */}
        <button
          type="button"
          onClick={handleBack}
          className="mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">返回</span>
        </button>

        <Card className="shadow-lg border-border">
          <CardHeader className="text-center pb-4">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-serif font-bold text-foreground">
              世界历史学习
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              登录账号同步你的学习数据
            </p>
          </CardHeader>

          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as TabValue)}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-2 mb-6">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  登录
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  注册
                </TabsTrigger>
              </TabsList>

              {/* 登录表单 */}
              <TabsContent value="login">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-identifier">
                      用户名 / 邮箱
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-identifier"
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => {
                          setLoginIdentifier(e.target.value);
                          if (loginErrors.identifier) {
                            setLoginErrors((prev) => ({
                              ...prev,
                              identifier: undefined,
                            }));
                          }
                        }}
                        placeholder="请输入用户名或邮箱"
                        className={`pl-10 ${
                          loginErrors.identifier
                            ? 'border-destructive focus-visible:border-destructive'
                            : ''
                        }`}
                        autoComplete="username"
                      />
                    </div>
                    {loginErrors.identifier && (
                      <p className="text-xs text-destructive">
                        {loginErrors.identifier}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (loginErrors.password) {
                            setLoginErrors((prev) => ({
                              ...prev,
                              password: undefined,
                            }));
                          }
                        }}
                        placeholder="请输入密码"
                        className={`pl-10 pr-10 ${
                          loginErrors.password
                            ? 'border-destructive focus-visible:border-destructive'
                            : ''
                        }`}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                        aria-label={showLoginPassword ? '隐藏密码' : '显示密码'}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="text-xs text-destructive">
                        {loginErrors.password}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loginLoading}
                  >
                    {loginLoading ? '登录中...' : '登录'}
                  </Button>

                  <p className="text-sm text-center text-muted-foreground pt-2">
                    还没有账号？{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-primary font-medium hover:underline"
                    >
                      立即注册
                    </button>
                  </p>
                </form>
              </TabsContent>

              {/* 注册表单 */}
              <TabsContent value="register">
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-username">用户名</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-username"
                        type="text"
                        value={regUsername}
                        onChange={(e) => {
                          setRegUsername(e.target.value);
                          if (regErrors.username) {
                            setRegErrors((prev) => ({
                              ...prev,
                              username: undefined,
                            }));
                          }
                        }}
                        placeholder="3-20 个字符"
                        className={`pl-10 ${
                          regErrors.username
                            ? 'border-destructive focus-visible:border-destructive'
                            : ''
                        }`}
                        autoComplete="username"
                      />
                    </div>
                    {regErrors.username && (
                      <p className="text-xs text-destructive">
                        {regErrors.username}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">邮箱</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => {
                          setRegEmail(e.target.value);
                          if (regErrors.email) {
                            setRegErrors((prev) => ({
                              ...prev,
                              email: undefined,
                            }));
                          }
                        }}
                        placeholder="your@email.com"
                        className={`pl-10 ${
                          regErrors.email
                            ? 'border-destructive focus-visible:border-destructive'
                            : ''
                        }`}
                        autoComplete="email"
                      />
                    </div>
                    {regErrors.email && (
                      <p className="text-xs text-destructive">
                        {regErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password">密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          if (regErrors.password) {
                            setRegErrors((prev) => ({
                              ...prev,
                              password: undefined,
                            }));
                          }
                        }}
                        placeholder="至少 6 位"
                        className={`pl-10 pr-10 ${
                          regErrors.password
                            ? 'border-destructive focus-visible:border-destructive'
                            : ''
                        }`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                        aria-label={showRegPassword ? '隐藏密码' : '显示密码'}
                      >
                        {showRegPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {regErrors.password && (
                      <p className="text-xs text-destructive">
                        {regErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-confirm">确认密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-confirm"
                        type={showRegConfirm ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => {
                          setRegConfirmPassword(e.target.value);
                          if (regErrors.confirmPassword) {
                            setRegErrors((prev) => ({
                              ...prev,
                              confirmPassword: undefined,
                            }));
                          }
                        }}
                        placeholder="再次输入密码"
                        className={`pl-10 pr-10 ${
                          regErrors.confirmPassword
                            ? 'border-destructive focus-visible:border-destructive'
                            : ''
                        }`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                        aria-label={showRegConfirm ? '隐藏密码' : '显示密码'}
                      >
                        {showRegConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {regErrors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {regErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2"
                    size="lg"
                    disabled={regLoading}
                  >
                    {regLoading ? '注册中...' : '注册账号'}
                  </Button>

                  <p className="text-sm text-center text-muted-foreground pt-1">
                    已有账号？{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="text-primary font-medium hover:underline"
                    >
                      去登录
                    </button>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          当前为本地模拟模式，数据保存在浏览器中
        </p>

        {/* 隐藏的 link 避免未使用警告 */}
        <Link to="/" className="hidden" aria-hidden>
          home
        </Link>
      </div>
    </div>
  );
};

export default AuthPage;
