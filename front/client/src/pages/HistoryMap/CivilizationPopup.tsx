import { X, Calendar, MapPin } from 'lucide-react';
import type { MapCivilization } from '../../types/history';
import { formatYearRange, getEraById, getRegionById } from '../../data/eras';

interface CivilizationPopupProps {
  civilization: MapCivilization | null;
  onClose: () => void;
}

const CivilizationPopup: React.FC<CivilizationPopupProps> = ({
  civilization,
  onClose,
}) => {
  if (!civilization) return null;

  const era = getEraById(civilization.era);
  const region = getRegionById(civilization.region);

  return (
    <div className="absolute top-4 right-4 z-20 w-64 bg-card rounded-xl shadow-lg border border-border overflow-hidden">
      {/* 顶部色条 */}
      <div
        className="h-2"
        style={{ backgroundColor: civilization.color }}
      />

      <div className="p-4">
        {/* 标题栏 */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-serif font-bold text-lg text-foreground leading-tight">
            {civilization.name}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 信息项 */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{formatYearRange(civilization.startYear, civilization.endYear)}</span>
          </div>

          {era && (
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: era.color }}
              />
              <span className="text-sm text-muted-foreground">{era.name}</span>
            </div>
          )}

          {region && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="text-sm">{region.name}</span>
            </div>
          )}
        </div>

        {/* 文明简介 */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getCivDescription(civilization.id)}
          </p>
        </div>
      </div>
    </div>
  );
};

function getCivDescription(id: string): string {
  const descriptions: Record<string, string> = {
    'egypt-old': '尼罗河畔的古老文明，以金字塔和象形文字闻名于世，延续了三千年。',
    'mesopotamia': '两河流域的人类最早文明之一，苏美尔人发明了楔形文字。',
    'indus': '印度河流域的古代城市文明，以摩亨佐-达罗和哈拉帕为代表。',
    'shang': '中国青铜时代的鼎盛时期，甲骨文和青铜器工艺达到很高水平。',
    'greece': '西方文明的摇篮，哲学、民主制度和科学思想的发源地。',
    'persia': '古代世界第一个横跨欧亚非的大帝国，建立了完善的驿道系统。',
    'qin-han': '中国大一统王朝，奠定了中华文明的基本格局和制度基础。',
    'rome-republic': '罗马从城邦扩张为地中海霸主的共和时期。',
    'rome-empire': '地跨欧亚非的庞大帝国，法律、建筑和军事影响深远。',
    'maya': '美洲古文明的杰出代表，在天文、历法和数学上成就卓著。',
    'byzantine': '东罗马帝国，保存了古希腊罗马文化，延续千年。',
    'tang': '中国历史上最强盛的朝代之一，文化繁荣，万国来朝。',
    'arab': '伊斯兰黄金时代，在科学、数学和文化上取得辉煌成就。',
    'carolingian': '查理曼大帝建立的西欧帝国，推动了加洛林文艺复兴。',
    'mongol': '人类历史上领土面积最大的帝国，横跨欧亚大陆。',
    'ming': '中国最后一个汉族王朝，郑和下西洋和紫禁城的建造。',
    'song': '中国古代经济文化最繁荣的时期，发明了活字印刷和指南针。',
    'ottoman': '延续六百年的伊斯兰帝国，扼守东西方交通要道。',
    'spain-empire': '第一个日不落帝国，大航海时代的先驱。',
    'qing': '中国最后一个封建王朝，奠定了现代中国的版图基础。',
    'british-empire': '历史上最大的殖民帝国，工业革命的发源地。',
    'france-empire': '拿破仑建立的法兰西帝国，横扫欧洲大陆。',
    'usa': '从殖民地崛起的超级大国，引领科技和文化潮流。',
    'germany-ww2': '二战时期的纳粹德国，发动了人类历史上最大规模的战争。',
    'soviet': '世界上第一个社会主义国家，冷战两极格局的一极。',
    'prc': '中华人民共和国，当今世界最大的发展中国家。',
  };
  return descriptions[id] ?? '一个重要的历史文明，对世界历史产生了深远影响。';
}

export default CivilizationPopup;
