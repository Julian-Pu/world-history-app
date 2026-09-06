import type { Era, Region, DifficultyLevel } from '../types/history';

export const ERAS: Era[] = [
  {
    id: 'ancient',
    name: '古代文明',
    startYear: -3500,
    endYear: 476,
    color: '#8B4513',
    description: '从最早的文明起源到西罗马帝国灭亡',
  },
  {
    id: 'medieval',
    name: '中世纪',
    startYear: 476,
    endYear: 1453,
    color: '#4A5568',
    description: '从西罗马灭亡到拜占庭帝国灭亡',
  },
  {
    id: 'early-modern',
    name: '近代早期',
    startYear: 1453,
    endYear: 1789,
    color: '#2F855A',
    description: '从文艺复兴到法国大革命',
  },
  {
    id: 'industrial',
    name: '工业革命时代',
    startYear: 1789,
    endYear: 1914,
    color: '#B7791F',
    description: '从工业革命到第一次世界大战',
  },
  {
    id: 'modern',
    name: '现代世界',
    startYear: 1914,
    endYear: 2024,
    color: '#6B46C1',
    description: '从第一次世界大战至今',
  },
];

export const REGIONS: Region[] = [
  { id: 'europe', name: '欧洲', color: '#3B82F6' },
  { id: 'asia', name: '亚洲', color: '#EF4444' },
  { id: 'africa', name: '非洲', color: '#F59E0B' },
  { id: 'americas', name: '美洲', color: '#10B981' },
  { id: 'global', name: '全球', color: '#8B5CF6' },
];

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    id: 'kindergarten',
    name: '幼儿园',
    description: '绘本故事风格，大图配简单文字',
  },
  {
    id: 'elementary',
    name: '小学',
    description: '故事化叙述，穿插趣味知识',
  },
  {
    id: 'middle',
    name: '初中',
    description: '结构化叙述，分背景/经过/影响',
  },
  {
    id: 'high',
    name: '高中',
    description: '学术化分析，多视角呈现',
  },
];

export function getEraById(id: string): Era | undefined {
  return ERAS.find(e => e.id === id);
}

export function getRegionById(id: string): Region | undefined {
  return REGIONS.find(r => r.id === id);
}

export function getDifficultyById(id: string): DifficultyLevel | undefined {
  return DIFFICULTY_LEVELS.find(d => d.id === id);
}

export function getEraColor(eraId: string): string {
  return getEraById(eraId)?.color ?? '#6B7280';
}

export function getRegionColor(regionId: string): string {
  return getRegionById(regionId)?.color ?? '#6B7280';
}

export function formatYear(year: number): string {
  if (year < 0) {
    return `前${Math.abs(year)}年`;
  }
  return `${year}年`;
}

export function formatYearRange(start: number, end: number): string {
  return `${formatYear(start)} - ${formatYear(end)}`;
}
