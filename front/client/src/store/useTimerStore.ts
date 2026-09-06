import { create } from 'zustand';
import { toast } from 'sonner';
import { useLearningStore } from './useLearningStore';

const REST_REMINDER_THRESHOLD = 2700; // 45 分钟
const REST_PAUSE_MINUTES = 5; // 休息提醒后自动暂停 5 分钟

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTodayMinutesFromStore(): number {
  const today = getTodayKey();
  return useLearningStore.getState().studyCalendar[today]?.minutes ?? 0;
}

interface TimerState {
  isRunning: boolean;
  sessionSeconds: number;
  todayTotalSeconds: number;
  restReminderShown: boolean;
  autoPauseUntil: number | null; // timestamp ms
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  syncFromLearningStore: () => void;
}

let _todayKey: string = getTodayKey();

function checkDayRollover(state: TimerState): Partial<TimerState> | null {
  const today = getTodayKey();
  if (today !== _todayKey) {
    _todayKey = today;
    const storedMinutes = getTodayMinutesFromStore();
    return {
      todayTotalSeconds: storedMinutes * 60,
      sessionSeconds: 0,
      restReminderShown: false,
    };
  }
  return null;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  sessionSeconds: 0,
  todayTotalSeconds: getTodayMinutesFromStore() * 60,
  restReminderShown: false,
  autoPauseUntil: null,

  start: () => {
    const { autoPauseUntil } = get();
    if (autoPauseUntil && Date.now() < autoPauseUntil) {
      return;
    }
    const rollover = checkDayRollover(get());
    if (rollover) set(rollover);
    set({ isRunning: true, autoPauseUntil: null });
  },

  pause: () => {
    set({ isRunning: false });
  },

  reset: () => {
    set({ sessionSeconds: 0, isRunning: false, restReminderShown: false });
  },

  tick: () => {
    const state = get();
    const rollover = checkDayRollover(state);
    if (rollover) {
      set({ ...state, ...rollover });
      return;
    }

    const { autoPauseUntil, isRunning, restReminderShown } = state;

    // 自动暂停中
    if (autoPauseUntil && Date.now() < autoPauseUntil) {
      if (isRunning) set({ isRunning: false });
      return;
    }
    if (autoPauseUntil && Date.now() >= autoPauseUntil) {
      set({ autoPauseUntil: null });
    }

    if (!isRunning) return;

    const newSession = state.sessionSeconds + 1;
    const newToday = state.todayTotalSeconds + 1;

    // 每累计 60 秒持久化 1 分钟
    if (newToday % 60 === 0) {
      useLearningStore.getState().addStudyTime(1);
    }

    // 连续学习 45 分钟休息提醒
    if (!restReminderShown && newSession >= REST_REMINDER_THRESHOLD) {
      toast.info('已连续学习45分钟，建议休息一下眼睛～', {
        description: `将自动暂停 ${REST_PAUSE_MINUTES} 分钟`,
      });
      set({
        sessionSeconds: newSession,
        todayTotalSeconds: newToday,
        isRunning: false,
        restReminderShown: true,
        autoPauseUntil: Date.now() + REST_PAUSE_MINUTES * 60 * 1000,
      });
      return;
    }

    set({
      sessionSeconds: newSession,
      todayTotalSeconds: newToday,
    });
  },

  syncFromLearningStore: () => {
    const storedMinutes = getTodayMinutesFromStore();
    set({ todayTotalSeconds: storedMinutes * 60 });
  },
}));
