import { useState, useRef, useCallback, useEffect } from 'react';
import type { MapCivilization, MapEventMarker, Difficulty } from '../../types/history';
import { formatYearRange } from '../../data/eras';
import BaseMapLayers from './BaseMapLayers';

export interface WorldMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

interface WorldMapProps {
  civilizations: MapCivilization[];
  highlightedId: string | null;
  onCivClick: (civ: MapCivilization) => void;
  eventMarkers?: MapEventMarker[];
  showEvents?: boolean;
  showTerritories?: boolean;
  difficulty?: Difficulty;
  onEventClick?: (eventId: string) => void;
  mapRef?: React.MutableRefObject<WorldMapHandle | null>;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

const WorldMap: React.FC<WorldMapProps> = ({
  civilizations,
  highlightedId,
  onCivClick,
  eventMarkers = [],
  showEvents = true,
  showTerritories = true,
  difficulty = 'elementary',
  onEventClick,
  mapRef,
}) => {
  const [scale, setScale] = useState<number>(1);
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const zoomIn = useCallback((): void => {
    setScale((s: number) => Math.min(MAX_SCALE, s * 1.3));
  }, []);

  const zoomOut = useCallback((): void => {
    setScale((s: number) => Math.max(MIN_SCALE, s / 1.3));
  }, []);

  const reset = useCallback((): void => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, []);

  useEffect(() => {
    if (mapRef) {
      mapRef.current = { zoomIn, zoomOut, reset };
    }
  }, [mapRef, zoomIn, zoomOut, reset]);

  const handleWheel = useCallback((e: React.WheelEvent): void => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s: number) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent): void => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      tx: translateX,
      ty: translateY,
    };
  }, [translateX, translateY]);

  const handleMouseMove = useCallback((e: React.MouseEvent): void => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTranslateX(dragStart.current.tx + dx / scale);
    setTranslateY(dragStart.current.ty + dy / scale);
  }, [isDragging, scale]);

  const handleMouseUp = useCallback((): void => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  const handleMouseLeave = useCallback((): void => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  return (
    <svg
      viewBox="0 0 900 500"
      className={`w-full h-full select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      preserveAspectRatio="xMidYMid meet"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <defs>
        {/* 海洋渐变 */}
        <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B8D4E8" />
          <stop offset="50%" stopColor="#9EC5DC" />
          <stop offset="100%" stopColor="#7DB3CF" />
        </linearGradient>

        {/* 大陆分层设色 */}
        <pattern id="landTexture" patternUnits="userSpaceOnUse" width="24" height="24">
          <rect width="24" height="24" fill="#E8D9B5" />
          <circle cx="6" cy="6" r="0.4" fill="#C4AE82" opacity="0.35" />
          <circle cx="18" cy="14" r="0.3" fill="#C4AE82" opacity="0.25" />
          <circle cx="12" cy="20" r="0.3" fill="#B89D6B" opacity="0.3" />
        </pattern>

        {/* 高原纹理 */}
        <pattern id="highlandTexture" patternUnits="userSpaceOnUse" width="24" height="24">
          <rect width="24" height="24" fill="#D4B88A" />
          <circle cx="8" cy="8" r="0.5" fill="#A68C5E" opacity="0.4" />
          <circle cx="16" cy="16" r="0.4" fill="#A68C5E" opacity="0.3" />
        </pattern>

        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#2C1810" floodOpacity="0.15" />
        </filter>

        <filter id="territoryGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 海洋背景 */}
      <rect width="900" height="500" fill="url(#oceanGradient)" rx="8" />

      {/* 经纬度网格 */}
      <g opacity="0.25" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 4">
        {[150, 300, 450, 600, 750].map((x: number) => (
          <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="500" />
        ))}
        {[100, 200, 300, 400].map((y: number) => (
          <line key={`h-${y}`} x1="0" y1={y} x2="900" y2={y} />
        ))}
        <line x1="0" y1="250" x2="900" y2="250" strokeDasharray="6 4" strokeWidth="0.8" opacity="0.5" />
      </g>

      {/* 地图内容组（缩放平移） */}
      <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
        {/* 大陆底图 */}
        <BaseMapLayers />

        {/* 文明疆域多边形 */}
        {showTerritories && difficulty !== 'kindergarten' && civilizations.map((civ: MapCivilization) =>
          civ.territoryPaths?.map((pathStr: string, pIdx: number) => (
            <path
              key={`terr-${civ.id}-${pIdx}`}
              d={pathStr}
              fill={civ.color}
              fillOpacity="0.25"
              stroke={civ.color}
              strokeOpacity="0.6"
              strokeWidth="1.2"
              filter="url(#territoryGlow)"
            />
          )),
        )}

        {/* 事件标记 */}
        {showEvents && difficulty !== 'kindergarten' && eventMarkers.map((marker: MapEventMarker) => (
          <g
            key={`evt-${marker.eventId}`}
            className="cursor-pointer"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onEventClick?.(marker.eventId);
            }}
          >
            <polygon
              points={getStarPoints(marker.x, marker.y, 6, 3, 5)}
              fill="#CD5C5C"
              stroke="#fff"
              strokeWidth="1"
              filter="url(#softShadow)"
            />
            <title>{getEventTitleById(marker.eventId)}</title>
          </g>
        ))}

        {/* 文明点标注 */}
        {civilizations.map((civ: MapCivilization) =>
          civ.positions.map((pos, idx: number) => {
            const isHighlighted = highlightedId === civ.id;
            return (
              <g
                key={`${civ.id}-${idx}`}
                className="cursor-pointer transition-transform duration-200 hover:scale-110 origin-center"
                style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onCivClick(civ);
                }}
              >
                {isHighlighted && (
                  <circle cx={pos.x} cy={pos.y} r="14" fill={civ.color} opacity="0.3">
                    <animate attributeName="r" values="12;18;12" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHighlighted ? 8 : 6}
                  fill={civ.color}
                  stroke="#fff"
                  strokeWidth="2"
                  filter="url(#softShadow)"
                />
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={pos.x + 10}
                    y={pos.y - 10}
                    width={civ.name.length * 14 + 12}
                    height="20"
                    rx="4"
                    fill="rgba(44, 24, 16, 0.85)"
                  />
                  <text
                    x={pos.x + 16}
                    y={pos.y + 4}
                    fill="#FBF6E9"
                    fontSize="12"
                    fontFamily="var(--font-serif)"
                    fontWeight="500"
                  >
                    {civ.name}
                  </text>
                </g>
                {pos.label && (
                  <text
                    x={pos.x}
                    y={pos.y + 22}
                    fill="#6B5B4F"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="var(--font-sans)"
                  >
                    {pos.label}
                  </text>
                )}
                <title>
                  {civ.name}（{formatYearRange(civ.startYear, civ.endYear)}）
                </title>
              </g>
            );
          }),
        )}
      </g>
    </svg>
  );
};

function getStarPoints(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
  const result: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    result.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return result.join(' ');
}

function getEventTitleById(id: string): string {
  const titles: Record<string, string> = {
    'egypt-unification-pyramids': '古埃及统一与金字塔建造',
    'hammurabi-code': '汉谟拉比法典',
    'greek-city-states': '希腊城邦',
    'buddhism-founding': '佛教创立',
    'confucianism': '儒家思想',
    'persian-wars': '希波战争',
    'alexander-conquest': '亚历山大东征',
    'qin-unification': '秦统一六国',
    'roman-empire': '罗马帝国',
    'silk-road': '丝绸之路',
    'christianity-birth': '基督教诞生',
    'western-rome-fall': '西罗马帝国灭亡',
    'islam-arab-empire': '伊斯兰与阿拉伯帝国',
    'carolingian-empire': '查理曼帝国',
    'crusades': '十字军东征',
    'mongol-empire': '蒙古帝国',
    'black-death': '黑死病',
    'byzantine-fall': '拜占庭帝国灭亡',
    'renaissance': '文艺复兴',
    'columbus-america': '哥伦布发现美洲',
    'reformation-luther': '宗教改革',
    'english-revolution': '英国资产阶级革命',
    'enlightenment': '启蒙运动',
    'american-independence': '美国独立战争',
    'french-revolution': '法国大革命',
    'industrial-revolution': '工业革命',
    'communist-manifesto': '《共产党宣言》',
    'american-civil-war': '美国内战',
    'meiji-restoration': '明治维新',
    'wwi': '第一次世界大战',
    'october-revolution': '十月革命',
    'wwii': '第二次世界大战',
    'united-nations': '联合国成立',
    'cold-war': '冷战',
    'prc-founding': '中华人民共和国成立',
    'soviet-collapse': '苏联解体',
    'internet-era': '互联网时代',
  };
  return titles[id] ?? id;
}

export default WorldMap;
