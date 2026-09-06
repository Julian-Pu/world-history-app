import type { MapCivilization, MapEventMarker } from '../types/history';

export const MAP_CIVILIZATIONS: MapCivilization[] = [
  {
    id: 'egypt-old',
    name: '古埃及',
    era: 'ancient',
    startYear: -3100,
    endYear: -30,
    region: 'africa',
    color: '#F59E0B',
    positions: [{ x: 465, y: 320, label: '尼罗河' }],
    territoryPaths: [
      'M450,290 L480,290 L485,310 L490,340 L485,370 L475,390 L455,395 L445,375 L440,345 L442,315 L450,290 Z',
    ],
  },
  {
    id: 'mesopotamia',
    name: '美索不达米亚',
    era: 'ancient',
    startYear: -3500,
    endYear: -539,
    region: 'asia',
    color: '#EF4444',
    positions: [{ x: 520, y: 280, label: '两河流域' }],
    territoryPaths: [
      'M500,260 L545,260 L555,275 L555,300 L545,315 L510,315 L500,300 L495,280 L500,260 Z',
    ],
  },
  {
    id: 'indus',
    name: '印度河文明',
    era: 'ancient',
    startYear: -2600,
    endYear: -1900,
    region: 'asia',
    color: '#EF4444',
    positions: [{ x: 620, y: 310 }],
    territoryPaths: [
      'M605,290 L630,288 L645,305 L645,330 L630,345 L605,340 L598,320 L600,300 L605,290 Z',
    ],
  },
  {
    id: 'shang',
    name: '商朝',
    era: 'ancient',
    startYear: -1600,
    endYear: -1046,
    region: 'asia',
    color: '#EF4444',
    positions: [{ x: 750, y: 290 }],
    territoryPaths: [
      'M720,270 L775,270 L785,295 L780,315 L755,325 L725,320 L715,300 L720,270 Z',
    ],
  },
  {
    id: 'greece',
    name: '古希腊',
    era: 'ancient',
    startYear: -800,
    endYear: -146,
    region: 'europe',
    color: '#3B82F6',
    positions: [{ x: 460, y: 260 }],
    territoryPaths: [
      'M445,245 L475,243 L485,258 L480,275 L460,280 L445,272 L440,258 L445,245 Z',
    ],
  },
  {
    id: 'persia',
    name: '波斯帝国',
    era: 'ancient',
    startYear: -550,
    endYear: -330,
    region: 'asia',
    color: '#EF4444',
    positions: [{ x: 560, y: 280 }],
    territoryPaths: [
      'M510,255 L605,250 L625,270 L630,295 L615,315 L580,325 L540,320 L515,305 L505,280 L510,255 Z',
    ],
  },
  {
    id: 'qin-han',
    name: '秦汉',
    era: 'ancient',
    startYear: -221,
    endYear: 220,
    region: 'asia',
    color: '#EF4444',
    positions: [{ x: 750, y: 290 }],
    territoryPaths: [
      'M700,260 L795,260 L810,285 L805,315 L780,335 L735,338 L710,325 L698,300 L700,260 Z',
    ],
  },
  {
    id: 'rome-republic',
    name: '罗马共和国',
    era: 'ancient',
    startYear: -509,
    endYear: -27,
    region: 'europe',
    color: '#3B82F6',
    positions: [{ x: 440, y: 250 }],
    territoryPaths: [
      'M425,240 L455,238 L465,255 L460,270 L440,275 L425,268 L420,255 L425,240 Z',
    ],
  },
  {
    id: 'rome-empire',
    name: '罗马帝国',
    era: 'ancient',
    startYear: -27,
    endYear: 476,
    region: 'europe',
    color: '#3B82F6',
    positions: [
      { x: 440, y: 250 },
      { x: 460, y: 250, label: '罗马' },
    ],
    territoryPaths: [
      // 意大利本土 + 地中海周边
      'M380,225 L485,220 L510,240 L525,270 L520,310 L495,345 L460,360 L430,355 L410,330 L400,295 L390,260 L380,225 Z',
      // 高卢（法国西班牙一带）
      'M385,220 L410,215 L425,230 L420,250 L400,260 L385,250 L380,235 L385,220 Z',
      // 不列颠南部
      'M395,205 L415,202 L420,215 L410,222 L395,218 L392,210 L395,205 Z',
    ],
  },
  {
    id: 'maya',
    name: '玛雅文明',
    era: 'ancient',
    startYear: -2000,
    endYear: 1500,
    region: 'americas',
    color: '#10B981',
    positions: [{ x: 200, y: 320 }],
    territoryPaths: [
      'M175,305 L225,305 L235,325 L225,345 L185,345 L175,330 L172,315 L175,305 Z',
    ],
  },
  {
    id: 'byzantine',
    name: '拜占庭帝国',
    era: 'medieval',
    startYear: 476,
    endYear: 1453,
    region: 'europe',
    color: '#3B82F6',
    positions: [{ x: 480, y: 260 }],
    territoryPaths: [
      'M455,245 L510,240 L530,260 L535,285 L520,305 L490,310 L465,300 L455,280 L450,260 L455,245 Z',
    ],
  },
  {
    id: 'tang',
    name: '唐朝',
    era: 'medieval',
    startYear: 618,
    endYear: 907,
    region: 'asia',
    color: '#EF4444',
    positions: [{ x: 750, y: 285 }],
    territoryPaths: [
      'M680,250 L810,255 L825,280 L815,320 L785,340 L730,345 L695,330 L675,300 L680,250 Z',
    ],
  },
  {
    id: 'arab',
    name: '阿拉伯帝国',
    era: 'medieval',
    startYear: 632,
    endYear: 1258,
    region: 'asia',
    color: '#F59E0B',
    positions: [
      { x: 540, y: 300 },
      { x: 430, y: 300, label: '巴格达' },
    ],
    territoryPaths: [
      // 中东核心
      'M475,265 L570,260 L590,280 L585,310 L560,335 L520,345 L485,340 L465,320 L460,290 L475,265 Z',
      // 北非
      'M420,290 L470,290 L472,315 L460,345 L430,355 L415,340 L410,315 L420,290 Z',
      // 伊比利亚半岛
      'M390,248 L415,245 L420,260 L410,270 L392,268 L388,258 L390,248 Z',
    ],
  },
  {
    id: 'carolingian',
    name: '查理曼帝国',
    era: 'medieval',
    startYear: 800,
    endYear: 843,
    region: 'europe',
    color: '#3B82F6',
    positions: [{ x: 420, y: 235 }],
    territoryPaths: [
      'M395,218 L445,215 L460,235 L455,258 L430,270 L405,265 L392,245 L395,218 Z',
    ],
  },
  {
    id: 'mongol',
    name: '蒙古帝国',
    era: 'medieval',
    startYear: 1206,
    endYear: 1260,
    region: 'asia',
    color: '#EF4444',
    positions: [
      { x: 650, y: 250 },
      { x: 680, y: 240, label: '蒙古' },
    ],
    territoryPaths: [
      // 横跨欧亚的大草原
      'M500,200 L750,200 L780,225 L770,255 L730,270 L650,275 L570,270 L520,255 L495,230 L500,200 Z',
    ],
  },
  {
    id: 'ming',
    name: '明朝',
    era: 'medieval',
    startYear: 1368,
    endYear: 1644,
    region: 'asia',
    color: '#EF4444',
    positions: [{ x: 750, y: 285 }],
    territoryPaths: [
      'M700,265 L800,265 L815,290 L808,320 L780,340 L730,340 L705,325 L698,295 L700,265 Z',
    ],
  },
  {
    id: 'song',
    name: '宋朝',
    era: 'medieval',
    startYear: 960,
    endYear: 1279,
    region: 'asia',
    color: '#EF4444',
    positions: [{ x: 750, y: 290 }],
    territoryPaths: [
      'M710,275 L790,275 L800,300 L790,325 L760,335 L725,330 L710,315 L708,295 L710,275 Z',
    ],
  },
  {
    id: 'ottoman',
    name: '奥斯曼帝国',
    era: 'early-modern',
    startYear: 1299,
    endYear: 1922,
    region: 'asia',
    color: '#F59E0B',
    positions: [{ x: 500, y: 280 }],
    territoryPaths: [
      'M460,245 L535,245 L550,270 L545,305 L520,330 L485,335 L460,320 L450,290 L455,260 L460,245 Z',
    ],
  },
  {
    id: 'spain-empire',
    name: '西班牙帝国',
    era: 'early-modern',
    startYear: 1492,
    endYear: 1975,
    region: 'europe',
    color: '#3B82F6',
    positions: [
      { x: 400, y: 255 },
      { x: 180, y: 330, label: '美洲殖民地' },
    ],
    territoryPaths: [
      // 伊比利亚
      'M388,240 L418,238 L425,258 L415,275 L392,275 L385,260 L388,240 Z',
      // 墨西哥/中美洲殖民地
      'M150,285 L230,285 L245,310 L235,340 L175,345 L150,330 L145,305 L150,285 Z',
      // 南美殖民地（安第斯）
      'M195,350 L255,345 L265,380 L255,415 L220,430 L200,420 L190,390 L195,350 Z',
    ],
  },
  {
    id: 'qing',
    name: '清朝',
    era: 'early-modern',
    startYear: 1644,
    endYear: 1912,
    region: 'asia',
    color: '#EF4444',
    positions: [{ x: 750, y: 285 }],
    territoryPaths: [
      'M670,230 L820,235 L835,270 L830,310 L805,340 L750,350 L700,340 L675,315 L665,275 L670,230 Z',
    ],
  },
  {
    id: 'british-empire',
    name: '大英帝国',
    era: 'industrial',
    startYear: 1707,
    endYear: 1997,
    region: 'europe',
    color: '#3B82F6',
    positions: [
      { x: 400, y: 220 },
      { x: 620, y: 320, label: '印度' },
      { x: 750, y: 290, label: '殖民地遍布全球' },
    ],
    territoryPaths: [
      // 不列颠
      'M393,205 L415,202 L420,220 L408,232 L395,230 L390,218 L393,205 Z',
      // 印度殖民地
      'M590,290 L650,288 L665,315 L655,345 L620,355 L595,345 L585,320 L590,290 Z',
      // 加拿大/北美东部
      'M80,150 L200,145 L215,180 L205,220 L160,240 L100,235 L75,200 L80,150 Z',
      // 澳大利亚
      'M755,380 L845,378 L855,405 L845,428 L800,432 L760,422 L750,400 L755,380 Z',
      // 南非
      'M490,405 L520,402 L525,420 L510,428 L492,425 L488,415 L490,405 Z',
    ],
  },
  {
    id: 'france-empire',
    name: '法兰西帝国',
    era: 'industrial',
    startYear: 1804,
    endYear: 1814,
    region: 'europe',
    color: '#3B82F6',
    positions: [{ x: 415, y: 240 }],
    territoryPaths: [
      'M390,220 L460,215 L475,235 L470,260 L445,275 L410,272 L392,255 L388,238 L390,220 Z',
    ],
  },
  {
    id: 'usa',
    name: '美国',
    era: 'industrial',
    startYear: 1776,
    endYear: 2024,
    region: 'americas',
    color: '#10B981',
    positions: [{ x: 180, y: 270 }],
    territoryPaths: [
      'M90,245 L250,240 L270,265 L265,295 L240,310 L170,315 L110,310 L85,285 L90,245 Z',
    ],
  },
  {
    id: 'germany-ww2',
    name: '纳粹德国',
    era: 'modern',
    startYear: 1933,
    endYear: 1945,
    region: 'europe',
    color: '#3B82F6',
    positions: [{ x: 435, y: 235 }],
    territoryPaths: [
      'M415,222 L460,220 L475,238 L470,258 L445,268 L420,262 L412,245 L415,222 Z',
    ],
  },
  {
    id: 'soviet',
    name: '苏联',
    era: 'modern',
    startYear: 1922,
    endYear: 1991,
    region: 'europe',
    color: '#EF4444',
    positions: [
      { x: 500, y: 230 },
      { x: 600, y: 230, label: '横跨欧亚' },
    ],
    territoryPaths: [
      'M450,200 L770,195 L795,225 L785,260 L740,275 L620,280 L520,275 L470,260 L445,235 L450,200 Z',
    ],
  },
  {
    id: 'prc',
    name: '中华人民共和国',
    era: 'modern',
    startYear: 1949,
    endYear: 2024,
    region: 'asia',
    color: '#EF4444',
    positions: [{ x: 750, y: 285 }],
    territoryPaths: [
      'M680,235 L825,240 L835,280 L825,315 L795,345 L740,350 L695,335 L675,305 L670,270 L680,235 Z',
    ],
  },
];

export function getCivilizationsAtYear(year: number): MapCivilization[] {
  return MAP_CIVILIZATIONS.filter(
    (c: MapCivilization) => year >= c.startYear && year <= c.endYear,
  );
}

// 事件地图坐标（基于 900×500 viewBox）
export const EVENT_MAP_POSITIONS: Record<string, { x: number; y: number }> = {
  // 古代文明
  'egypt-unification-pyramids': { x: 465, y: 320 },
  'hammurabi-code': { x: 520, y: 280 },
  'greek-city-states': { x: 455, y: 255 },
  'buddhism-founding': { x: 620, y: 310 },
  'confucianism': { x: 750, y: 290 },
  'persian-wars': { x: 540, y: 265 },
  'alexander-conquest': { x: 500, y: 260 },
  'qin-unification': { x: 745, y: 290 },
  'roman-empire': { x: 440, y: 250 },
  'silk-road': { x: 600, y: 270 },
  'christianity-birth': { x: 495, y: 275 },
  'western-rome-fall': { x: 435, y: 250 },
  // 中世纪
  'islam-arab-empire': { x: 520, y: 295 },
  'carolingian-empire': { x: 420, y: 235 },
  'crusades': { x: 485, y: 260 },
  'mongol-empire': { x: 660, y: 245 },
  'black-death': { x: 445, y: 250 },
  'byzantine-fall': { x: 485, y: 258 },
  // 近代早期
  'renaissance': { x: 450, y: 250 },
  'columbus-america': { x: 200, y: 300 },
  'reformation-luther': { x: 430, y: 230 },
  'english-revolution': { x: 400, y: 220 },
  'enlightenment': { x: 415, y: 240 },
  'american-independence': { x: 180, y: 265 },
  // 工业革命时代
  'french-revolution': { x: 415, y: 240 },
  'industrial-revolution': { x: 400, y: 220 },
  'communist-manifesto': { x: 425, y: 235 },
  'american-civil-war': { x: 175, y: 275 },
  'meiji-restoration': { x: 830, y: 280 },
  'wwi': { x: 440, y: 235 },
  // 现代世界
  'october-revolution': { x: 520, y: 220 },
  'wwii': { x: 450, y: 240 },
  'united-nations': { x: 450, y: 280 },
  'cold-war': { x: 350, y: 250 },
  'prc-founding': { x: 750, y: 285 },
  'soviet-collapse': { x: 530, y: 225 },
  'internet-era': { x: 185, y: 270 },
};

// 根据难度筛选事件 marker
export function getEventMarkersForDifficulty(
  difficulty: 'kindergarten' | 'elementary' | 'middle' | 'high',
): MapEventMarker[] {
  if (difficulty === 'kindergarten') return [];

  const highEvents = Object.keys(EVENT_MAP_POSITIONS);
  const positions: Record<string, { x: number; y: number }> = EVENT_MAP_POSITIONS;

  if (difficulty === 'high') {
    return highEvents.map((id: string): MapEventMarker => ({
      eventId: id,
      x: positions[id].x,
      y: positions[id].y,
    }));
  }

  // 初中: 25个左右主要事件
  const middleEventIds = [
    'egypt-unification-pyramids',
    'hammurabi-code',
    'greek-city-states',
    'buddhism-founding',
    'confucianism',
    'persian-wars',
    'alexander-conquest',
    'qin-unification',
    'roman-empire',
    'silk-road',
    'christianity-birth',
    'western-rome-fall',
    'islam-arab-empire',
    'crusades',
    'mongol-empire',
    'renaissance',
    'columbus-america',
    'french-revolution',
    'industrial-revolution',
    'american-civil-war',
    'meiji-restoration',
    'wwi',
    'wwii',
    'prc-founding',
    'soviet-collapse',
  ];

  if (difficulty === 'middle') {
    return middleEventIds.map((id: string): MapEventMarker => ({
      eventId: id,
      x: positions[id].x,
      y: positions[id].y,
    }));
  }

  // 小学: 约15个重要事件
  const elementaryEventIds = [
    'egypt-unification-pyramids',
    'greek-city-states',
    'confucianism',
    'roman-empire',
    'silk-road',
    'mongol-empire',
    'columbus-america',
    'renaissance',
    'american-independence',
    'french-revolution',
    'industrial-revolution',
    'wwi',
    'wwii',
    'prc-founding',
    'internet-era',
  ];

  return elementaryEventIds.map((id: string): MapEventMarker => ({
    eventId: id,
    x: positions[id].x,
    y: positions[id].y,
  }));
}
