import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserLearningData, Note, QuizRecord } from '../types/history';
import { ACHIEVEMENTS } from '../data/achievements';
import { EVENTS } from '../data/events';
import { safeStorage } from '../utils/safeStorage';
import api from '../utils/api';
import { useAppStore } from './useAppStore';

const initialData: UserLearningData = {
  readEvents: [],
  readFigures: [],
  favorites: { events: [], figures: [] },
  notes: [],
  quizRecords: [],
  wrongQuestions: [],
  achievements: [],
  studyCalendar: {},
  totalStudyMinutes: 0,
  streakDays: 0,
  lastStudyDate: '',
};

interface LearningState extends UserLearningData {
  markEventRead: (eventId: string) => void;
  markFigureRead: (figureId: string) => void;
  toggleEventRead: (eventId: string) => void;
  toggleFigureRead: (figureId: string) => void;
  toggleFavoriteEvent: (eventId: string) => void;
  toggleFavoriteFigure: (figureId: string) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addQuizRecord: (record: Omit<QuizRecord, 'id'>) => void;
  addWrongQuestion: (questionId: string) => void;
  removeWrongQuestion: (questionId: string) => void;
  clearWrongQuestions: () => void;
  addStudyTime: (minutes: number) => void;
  checkAchievements: () => string[];
  resetAll: () => void;
  importData: (data: UserLearningData) => void;
  getEraProgress: (eraId: string) => number;
  loadFromCloud: () => Promise<void>;
  pushToCloud: () => Promise<void>;
  syncAll: () => Promise<void>;
  isCloudMode: () => boolean;
  syncing: boolean;
  lastSyncAt: string;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function calculateStreak(calendar: Record<string, { minutes: number }>, lastDate: string): number {
  if (!lastDate) return 0;
  let streak = 0;
  const d = new Date(lastDate);
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (calendar[key] && calendar[key].minutes > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      ...initialData,
      syncing: false,
      lastSyncAt: '',

      // 判断是否为云端模式：已登录（有token）且用户设置为云端模式
      // 注意：从 useAppStore 内存状态读取，而不是 localStorage，避免 safeStorage 写入失败导致读取旧值
      isCloudMode: () => {
        try {
          // 必须先有token（已登录）才能云端同步
          const token = localStorage.getItem('history-app-token');
          if (!token) return false;
          
          // 从 useAppStore 内存状态读取用户设置的存储模式
          const appState = useAppStore.getState();
          return appState.storageMode === 'cloud';
        } catch {}
        return false;
      },

      // 从云端拉取所有数据
      loadFromCloud: async () => {
        if (!get().isCloudMode()) return;
        set({ syncing: true });
        try {
          // 并行拉取各类数据（确保都是数组）
          const results = await Promise.all([
            api.progress.list().catch(() => []),
            api.notes.list().catch(() => []),
            api.favorites.list().catch(() => []),
            api.quizzes.records().catch(() => []),
            api.achievements.list().catch(() => []),
            api.studySessions.list().catch(() => []),
          ]);
          const progress = Array.isArray(results[0]) ? results[0] : [];
          const notes = Array.isArray(results[1]) ? results[1] : [];
          const favorites = Array.isArray(results[2]) ? results[2] : [];
          const quizRecords = Array.isArray(results[3]) ? results[3] : [];
          const achievements = Array.isArray(results[4]) ? results[4] : [];
          const studySessions = Array.isArray(results[5]) ? results[5] : [];

          // 转换进度数据
          const readEvents = progress
            .filter((p: any) => p.content_type === 'event' && p.status === 'completed')
            .map((p: any) => p.content_id);
          const readFigures = progress
            .filter((p: any) => p.content_type === 'figure' && p.status === 'completed')
            .map((p: any) => p.content_id);

          // 转换收藏数据
          const favEvents = favorites
            .filter((f: any) => f.content_type === 'event')
            .map((f: any) => f.content_id);
          const favFigures = favorites
            .filter((f: any) => f.content_type === 'figure')
            .map((f: any) => f.content_id);

          // 转换笔记数据
          const formattedNotes = notes.map((n: any) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            content_type: n.content_type,
            content_id: n.content_id,
            tags: n.tags ? JSON.parse(n.tags) : [],
            createdAt: n.created_at,
            updatedAt: n.updated_at,
          }));

          // 转换测验记录
          const formattedQuizRecords = quizRecords.map((r: any) => ({
            id: r.id,
            quizId: r.quiz_id,
            score: r.score,
            total: r.total,
            correct: r.correct,
            accuracy: r.accuracy,
            timeSpent: r.time_spent,
            completedAt: r.completed_at || r.created_at,
          }));

          // 转换成就
          const achievementIds = achievements.map((a: any) => a.achievement_id || a.id);

          // 转换学习时长记录为日历格式
          // 注意：后端返回的 duration 单位是秒，字段名是 duration
          const cloudCalendar: Record<string, { minutes: number; eventsRead: number }> = {};
          let cloudTotalMinutes = 0;
          studySessions.forEach((s: any) => {
            // 后端 duration 是秒，转换为分钟
            const durationSeconds = s.duration || 0;
            const durationMinutes = durationSeconds / 60;
            cloudTotalMinutes += durationMinutes;
            // 从 start_time 提取日期
            const dateStr = (s.start_time || s.created_at || '').slice(0, 10);
            if (dateStr) {
              if (!cloudCalendar[dateStr]) {
                cloudCalendar[dateStr] = { minutes: 0, eventsRead: 0 };
              }
              cloudCalendar[dateStr].minutes += durationMinutes;
            }
          });

          // 获取当前本地数据，用于合并
          const localState = get();

          // 合并函数：取并集
          const mergeArray = (local: any[], cloud: any[]) => {
            const set = new Set([...local, ...cloud]);
            return Array.from(set);
          };

          // 合并笔记/测验记录（按id去重，云端优先）
          const mergeById = (local: any[], cloud: any[]) => {
            const map = new Map();
            local.forEach(item => map.set(item.id, item));
            cloud.forEach(item => map.set(item.id, item));
            return Array.from(map.values());
          };

          // 合并学习日历
          const mergeCalendar = (local: any, cloud: any) => {
            const merged = { ...local };
            for (const date of Object.keys(cloud || {})) {
              if (merged[date]) {
                merged[date] = {
                  minutes: Math.max(merged[date].minutes || 0, cloud[date].minutes || 0),
                  eventsRead: Math.max(merged[date].eventsRead || 0, cloud[date].eventsRead || 0),
                };
              } else {
                merged[date] = cloud[date];
              }
            }
            return merged;
          };

          set({
            // 数组类型取并集
            readEvents: mergeArray(localState.readEvents, readEvents),
            readFigures: mergeArray(localState.readFigures, readFigures),
            favorites: {
              events: mergeArray(localState.favorites.events, favEvents),
              figures: mergeArray(localState.favorites.figures, favFigures),
            },
            wrongQuestions: mergeArray(localState.wrongQuestions, []), // 错题本暂不同步
            achievements: mergeArray(localState.achievements, achievementIds),
            // 按id合并
            notes: mergeById(localState.notes, formattedNotes),
            quizRecords: mergeById(localState.quizRecords, formattedQuizRecords),
            // 日历和统计取最大值
            studyCalendar: mergeCalendar(localState.studyCalendar, cloudCalendar),
            totalStudyMinutes: Math.max(localState.totalStudyMinutes, cloudTotalMinutes),
            streakDays: Math.max(localState.streakDays, 0),
            lastStudyDate: localState.lastStudyDate || Object.keys(cloudCalendar).sort().pop() || '',
            lastSyncAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('从云端拉取数据失败:', error);
        } finally {
          set({ syncing: false });
        }
      },

      // 把本地所有数据推送到云端
      pushToCloud: async () => {
        if (!get().isCloudMode()) return;
        set({ syncing: true });
        try {
          const state = get();
          const promises: Promise<any>[] = [];

          // 推送学习进度（事件）
          state.readEvents.forEach(eventId => {
            promises.push(
              api.progress.update({
                content_type: 'event',
                content_id: eventId,
                status: 'completed',
              }).catch(() => {})
            );
          });

          // 推送学习进度（人物）
          state.readFigures.forEach(figureId => {
            promises.push(
              api.progress.update({
                content_type: 'figure',
                content_id: figureId,
                status: 'completed',
              }).catch(() => {})
            );
          });

          // 推送收藏（事件）
          state.favorites.events.forEach(eventId => {
            promises.push(
              api.favorites.toggle('event', eventId).catch(() => {})
            );
          });

          // 推送收藏（人物）
          state.favorites.figures.forEach(figureId => {
            promises.push(
              api.favorites.toggle('figure', figureId).catch(() => {})
            );
          });

          // 推送笔记（只推送本地生成的ID，后端返回的ID已经同步过）
          state.notes.forEach(note => {
            if (note.id.startsWith('note-')) {
              promises.push(
                api.notes.create({
                  content_type: (note as any).content_type,
                  content_id: (note as any).content_id,
                  title: note.title,
                  content: note.content,
                  tags: (note as any).tags || [],
                }).then((res: any) => {
                  if (res?.id) {
                    set({
                      notes: get().notes.map(n =>
                        n.id === note.id ? { ...n, id: res.id } : n
                      ),
                    });
                  }
                }).catch(() => {})
              );
            }
          });

          // 等待所有推送完成
          await Promise.all(promises);

          set({ lastSyncAt: new Date().toISOString() });
        } catch (error) {
          console.error('推送数据到云端失败:', error);
        } finally {
          set({ syncing: false });
        }
      },

      // 完整同步：先推送本地数据，再从云端拉取合并
      syncAll: async () => {
        if (!get().isCloudMode()) return;
        await get().pushToCloud();
        await get().loadFromCloud();
      },
      markEventRead: (eventId: string) => {
        const { readEvents, studyCalendar, isCloudMode } = get();
        if (readEvents.includes(eventId)) return;
        const today = getTodayKey();
        const todayData = studyCalendar[today] ?? { minutes: 0, eventsRead: 0 };
        set({
          readEvents: [...readEvents, eventId],
          studyCalendar: {
            ...studyCalendar,
            [today]: { ...todayData, eventsRead: todayData.eventsRead + 1 },
          },
        });
        get().checkAchievements();
        // 云端同步
        if (isCloudMode()) {
          api.progress.update({
            content_type: 'event',
            content_id: eventId,
            status: 'completed',
          }).catch(e => console.error('同步进度失败:', e));
        }
      },
      markFigureRead: (figureId: string) => {
        const { readFigures, isCloudMode } = get();
        if (readFigures.includes(figureId)) return;
        set({ readFigures: [...readFigures, figureId] });
        // 云端同步
        if (isCloudMode()) {
          api.progress.update({
            content_type: 'figure',
            content_id: figureId,
            status: 'completed',
          }).catch(e => console.error('同步进度失败:', e));
        }
      },
      toggleEventRead: (eventId: string) => {
        const { readEvents, studyCalendar, isCloudMode } = get();
        const exists = readEvents.includes(eventId);
        if (exists) {
          set({ readEvents: readEvents.filter(id => id !== eventId) });
        } else {
          const today = getTodayKey();
          const todayData = studyCalendar[today] ?? { minutes: 0, eventsRead: 0 };
          set({
            readEvents: [...readEvents, eventId],
            studyCalendar: {
              ...studyCalendar,
              [today]: { ...todayData, eventsRead: todayData.eventsRead + 1 },
            },
          });
          get().checkAchievements();
        }
        // 云端同步
        if (isCloudMode()) {
          api.progress.update({
            content_type: 'event',
            content_id: eventId,
            status: exists ? 'unread' : 'completed',
          }).catch(e => console.error('同步进度失败:', e));
        }
      },
      toggleFigureRead: (figureId: string) => {
        const { readFigures, isCloudMode } = get();
        const exists = readFigures.includes(figureId);
        set({
          readFigures: exists
            ? readFigures.filter(id => id !== figureId)
            : [...readFigures, figureId],
        });
        // 云端同步
        if (isCloudMode()) {
          api.progress.update({
            content_type: 'figure',
            content_id: figureId,
            status: exists ? 'unread' : 'completed',
          }).catch(e => console.error('同步进度失败:', e));
        }
      },
      toggleFavoriteEvent: (eventId: string) => {
        const { favorites, isCloudMode } = get();
        const exists = favorites.events.includes(eventId);
        set({
          favorites: {
            ...favorites,
            events: exists
              ? favorites.events.filter(id => id !== eventId)
              : [...favorites.events, eventId],
          },
        });
        // 云端同步
        if (isCloudMode()) {
          api.favorites.toggle('event', eventId).catch(e => console.error('同步收藏失败:', e));
        }
      },
      toggleFavoriteFigure: (figureId: string) => {
        const { favorites, isCloudMode } = get();
        const exists = favorites.figures.includes(figureId);
        set({
          favorites: {
            ...favorites,
            figures: exists
              ? favorites.figures.filter(id => id !== figureId)
              : [...favorites.figures, figureId],
          },
        });
        // 云端同步
        if (isCloudMode()) {
          api.favorites.toggle('figure', figureId).catch(e => console.error('同步收藏失败:', e));
        }
      },
      addNote: (note) => {
        const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date().toISOString();
        const newNote: Note = {
          tags: [],
          ...note,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set({ notes: [newNote, ...get().notes] });
        get().checkAchievements();
        // 云端同步
        if (get().isCloudMode()) {
          api.notes.create({
            content_type: (note as any).content_type,
            content_id: (note as any).content_id,
            title: note.title,
            content: note.content,
            tags: (note as any).tags || [],
          }).then((res: any) => {
            // 更新本地笔记ID为后端返回的ID
            if (res?.id) {
              set({
                notes: get().notes.map(n => n.id === id ? { ...n, id: res.id } : n),
              });
            }
          }).catch(e => console.error('同步笔记失败:', e));
        }
        return id;
      },
      updateNote: (id, patch) => {
        set({
          notes: get().notes.map(n =>
            n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n,
          ),
        });
        // 云端同步
        if (get().isCloudMode()) {
          const note = get().notes.find(n => n.id === id);
          if (note) {
            api.notes.update(id, {
              title: note.title,
              content: note.content,
              tags: (note as any).tags || [],
            }).catch(e => console.error('更新笔记失败:', e));
          }
        }
      },
      deleteNote: (id) => {
        set({ notes: get().notes.filter(n => n.id !== id) });
        // 云端同步
        if (get().isCloudMode()) {
          api.notes.delete(id).catch(e => console.error('删除笔记失败:', e));
        }
      },
      addQuizRecord: (record) => {
        const id = `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        set({ quizRecords: [{ ...record, id }, ...get().quizRecords] });
        get().checkAchievements();
        // 云端同步
        if (get().isCloudMode()) {
          api.quizzes.submit({
            quiz_id: (record as any).quizId,
            score: record.score,
            total: record.total,
            correct: record.correct,
            accuracy: record.accuracy,
            time_spent: (record as any).timeSpent,
          }).catch(e => console.error('同步测验记录失败:', e));
        }
      },
      addWrongQuestion: (questionId) => {
        const { wrongQuestions } = get();
        if (wrongQuestions.includes(questionId)) return;
        set({ wrongQuestions: [...wrongQuestions, questionId] });
      },
      removeWrongQuestion: (questionId) => {
        set({ wrongQuestions: get().wrongQuestions.filter(id => id !== questionId) });
      },
      clearWrongQuestions: () => set({ wrongQuestions: [] }),
      addStudyTime: (minutes) => {
        const today = getTodayKey();
        const { studyCalendar, totalStudyMinutes, lastStudyDate, isCloudMode } = get();
        const todayData = studyCalendar[today] ?? { minutes: 0, eventsRead: 0 };
        const newCalendar = {
          ...studyCalendar,
          [today]: { ...todayData, minutes: todayData.minutes + minutes },
        };
        const newStreak = calculateStreak(newCalendar, today);
        set({
          totalStudyMinutes: totalStudyMinutes + minutes,
          studyCalendar: newCalendar,
          lastStudyDate: today,
          streakDays: newStreak,
        });
        get().checkAchievements();
        // 云端同步
        if (isCloudMode()) {
          api.studySessions.create({
            duration_minutes: minutes,
            session_type: 'study',
          }).catch(e => console.error('同步学习时长失败:', e));
        }
      },
      checkAchievements: () => {
        const state = get();
        const newlyUnlocked: string[] = [];
        const currentSet = new Set(state.achievements);
        const eraEventCounts: Record<string, number> = {};
        for (const ev of EVENTS) {
          eraEventCounts[ev.era] = (eraEventCounts[ev.era] ?? 0) + 1;
        }
        for (const ach of ACHIEVEMENTS) {
          if (currentSet.has(ach.id)) continue;
          let unlocked = false;
          switch (ach.condition.type) {
            case 'events-read':
              unlocked = state.readEvents.length >= ach.condition.value;
              break;
            case 'quiz-perfect':
              unlocked = state.quizRecords.some(r => r.accuracy === 100);
              break;
            case 'streak-days':
              unlocked = state.streakDays >= ach.condition.value;
              break;
            case 'notes-count':
              unlocked = state.notes.length >= ach.condition.value;
              break;
            case 'study-hours':
              unlocked = state.totalStudyMinutes >= ach.condition.value * 60;
              break;
            case 'era-complete': {
              const eraId = ach.condition.eraId;
              if (eraId) {
                const eraTotal = eraEventCounts[eraId] ?? 0;
                const eraRead = state.readEvents.filter(
                  eid => EVENTS.find(ev => ev.id === eid)?.era === eraId,
                ).length;
                unlocked = eraTotal > 0 && eraRead >= eraTotal;
              }
              break;
            }
          }
          if (unlocked) {
            newlyUnlocked.push(ach.id);
            currentSet.add(ach.id);
          }
        }
        if (newlyUnlocked.length > 0) {
          set({ achievements: Array.from(currentSet) });
        }
        return newlyUnlocked;
      },
      resetAll: () => set({ ...initialData }),
      importData: (data) => set({ ...data }),
      getEraProgress: (eraId) => {
        const total = EVENTS.filter(e => e.era === eraId).length;
        if (total === 0) return 0;
        const read = get().readEvents.filter(id => EVENTS.find(e => e.id === id)?.era === eraId).length;
        return Math.round((read / total) * 100);
      },
    }),
    {
      name: 'history-app-learning',
      storage: safeStorage,
    },
  ),
);
