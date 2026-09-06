/**
 * 前端模拟用户认证工具（localStorage 存储）
 * 第一版仅用于前端演示，后续可替换为真实后端接口
 */

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

const USERS_KEY = 'history-app-users';
const CURRENT_USER_KEY = 'history-app-current-user';

/**
 * 简易密码哈希（仅前端模拟使用，非安全加密）
 */
function hashPassword(password: string): string {
  try {
    return btoa(unescape(encodeURIComponent(password + ':history-app-salt')));
  } catch {
    // 降级方案
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return String(hash);
  }
}

/**
 * 从 localStorage 读取所有用户
 */
function getUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * 保存所有用户到 localStorage
 */
function saveUsers(users: AuthUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * 用户注册
 * @returns 注册成功返回用户信息，失败抛出错误
 */
export function register(
  username: string,
  email: string,
  password: string,
): AuthUser {
  const users = getUsers();

  // 检查用户名是否已存在
  if (users.some((u: AuthUser) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('用户名已被注册');
  }

  // 检查邮箱是否已存在
  if (users.some((u: AuthUser) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('该邮箱已被注册');
  }

  const newUser: AuthUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username,
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // 注册后自动登录
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

  return newUser;
}

/**
 * 用户登录
 * @param identifier 用户名或邮箱
 * @param password 密码
 * @returns 登录成功返回用户信息，失败抛出错误
 */
export function login(identifier: string, password: string): AuthUser {
  const users = getUsers();
  const lowerIdentifier = identifier.toLowerCase();

  const user = users.find(
    (u: AuthUser) =>
      u.username.toLowerCase() === lowerIdentifier ||
      u.email.toLowerCase() === lowerIdentifier,
  );

  if (!user) {
    throw new Error('用户不存在');
  }

  if (user.passwordHash !== hashPassword(password)) {
    throw new Error('密码错误');
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

/**
 * 退出登录
 */
export function logout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

/**
 * 获取当前登录用户
 */
export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * 表单验证工具
 */
export const authValidators = {
  username: (value: string): string | null => {
    if (!value.trim()) return '请输入用户名';
    if (value.length < 3 || value.length > 20) return '用户名长度需在 3-20 个字符之间';
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(value)) {
      return '用户名只能包含字母、数字、下划线和中文';
    }
    return null;
  },

  email: (value: string): string | null => {
    if (!value.trim()) return '请输入邮箱';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return '请输入有效的邮箱地址';
    return null;
  },

  password: (value: string): string | null => {
    if (!value) return '请输入密码';
    if (value.length < 6) return '密码长度至少 6 位';
    return null;
  },

  confirmPassword: (password: string, confirm: string): string | null => {
    if (!confirm) return '请再次输入密码';
    if (password !== confirm) return '两次输入的密码不一致';
    return null;
  },
};
