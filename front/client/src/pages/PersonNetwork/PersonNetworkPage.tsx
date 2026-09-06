import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import { ArrowLeft, Users, Filter, Loader2, Info } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@client/src/components/ui/dialog';

// 关系类型颜色映射
const RELATION_COLORS: Record<string, string> = {
  '君臣': '#3b82f6',
  '师生': '#10b981',
  '对手': '#ef4444',
  '政敌': '#f97316',
  '父子': '#8b5cf6',
  '兄弟': '#06b6d4',
  '夫妻': '#ec4899',
  '祖孙': '#a855f7',
  '朋友': '#14b8a6',
  '盟友': '#22c55e',
  '反叛': '#dc2626',
  '继承': '#eab308',
  '同学': '#f59e0b',
  '同时代思想家': '#6366f1',
};

// 朝代分类颜色
const DYNASTY_COLORS: Record<string, string> = {
  '春秋': '#fbbf24',
  '战国': '#f59e0b',
  '秦朝': '#ef4444',
  '秦末': '#dc2626',
  '西汉': '#3b82f6',
  '东汉末': '#2563eb',
  '蜀汉': '#22c55e',
  '东吴': '#16a34a',
  '北魏': '#8b5cf6',
  '隋朝': '#f97316',
  '唐朝': '#eab308',
  '武周': '#d946ef',
  '北宋': '#06b6d4',
  '南宋': '#0891b2',
  '蒙古': '#78716c',
  '元朝': '#57534e',
  '明朝': '#dc2626',
  '后金': '#991b1b',
  '清朝': '#7f1d1d',
};

interface PersonNode {
  id: string;
  name: string;
  category: string;
  role: string;
  symbolSize: number;
  itemStyle?: { color: string };
}

interface PersonLink {
  source: string;
  target: string;
  relation_type: string;
  lineStyle?: { color: string };
}

interface PersonDetail {
  id: string;
  name: string;
  dynasty: string;
  role: string;
  birth_year: string;
  death_year: string;
  level_contents?: { summary?: string };
  relations?: Array<{
    related_id: string;
    related_name: string;
    relation_type: string;
    description: string;
  }>;
}

const PersonNetworkPage: React.FC = () => {
  const navigate = useNavigate();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  
  const [nodes, setNodes] = useState<PersonNode[]>([]);
  const [links, setLinks] = useState<PersonLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDynasty, setSelectedDynasty] = useState<string>('全部');
  const [selectedPerson, setSelectedPerson] = useState<PersonDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // 获取所有朝代
  const dynasties = ['全部', ...Array.from(new Set(nodes.map(n => n.category))).sort()];

  // 过滤后的节点和连线
  const filteredNodes = selectedDynasty === '全部'
    ? nodes
    : nodes.filter(n => n.category === selectedDynasty);
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredLinks = links.filter(l =>
    filteredNodeIds.has(l.source) && filteredNodeIds.has(l.target)
  );

  // 初始化图表
  const initChart = useCallback(() => {
    if (!chartRef.current) return;
    
    // 销毁旧实例
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }
    
    chartInstance.current = echarts.init(chartRef.current);
    
    // 点击事件
    chartInstance.current.on('click', (params: any) => {
      if (params.dataType === 'node') {
        handleNodeClick(params.data.id);
      }
    });
  }, []);

  // 更新图表
  const updateChart = useCallback(() => {
    if (!chartInstance.current || filteredNodes.length === 0) return;
    
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            return `<div style="font-weight:bold;font-size:14px">${params.data.name}</div>
              <div style="color:#666;font-size:12px;margin-top:4px">
                朝代：${params.data.category}<br/>
                身份：${params.data.role || '未知'}
              </div>`;
          } else if (params.dataType === 'edge') {
            return `<div style="font-size:12px">
              ${params.data.source} — ${params.data.relation_type} — ${params.data.target}
            </div>`;
          }
          return '';
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: filteredNodes,
          links: filteredLinks,
          roam: true,
          draggable: true,
          label: {
            show: true,
            position: 'right',
            fontSize: 11,
            formatter: '{b}',
          },
          force: {
            repulsion: 150,
            edgeLength: [50, 100],
            gravity: 0.1,
            friction: 0.6,
          },
          lineStyle: {
            opacity: 0.6,
            width: 1.5,
            curveness: 0.1,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 3 },
          },
        },
      ],
    };
    
    chartInstance.current.setOption(option, true);
  }, [filteredNodes, filteredLinks]);

  // 获取人物详情
  const handleNodeClick = async (personId: string) => {
    try {
      const response = await fetch(`/api/people/${personId}`);
      const result = await response.json();
      if (result.success && result.data) {
        setSelectedPerson(result.data);
        setShowDetail(true);
      }
    } catch (e) {
      console.error('获取人物详情失败:', e);
    }
  };

  // 获取网络数据
  const fetchNetwork = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/people/network/graph?limit=100');
      const result = await response.json();
      if (result.success && result.data) {
        // 计算每个节点的关系数量
        const relationCount: Record<string, number> = {};
        result.data.links.forEach((link: PersonLink) => {
          relationCount[link.source] = (relationCount[link.source] || 0) + 1;
          relationCount[link.target] = (relationCount[link.target] || 0) + 1;
        });

        const processedNodes = result.data.nodes.map((node: PersonNode) => ({
          ...node,
          symbolSize: 25 + (relationCount[node.id] || 0) * 4,
          itemStyle: { color: DYNASTY_COLORS[node.category] || '#6b7280' },
        }));

        const processedLinks = result.data.links.map((link: PersonLink) => ({
          ...link,
          lineStyle: { color: RELATION_COLORS[link.relation_type] || '#9ca3af' },
        }));

        setNodes(processedNodes);
        setLinks(processedLinks);
      } else {
        setError('获取人物关系网络失败');
      }
    } catch (e) {
      setError('网络请求失败，请稍后重试');
      console.error('获取人物关系网络失败:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件挂载时初始化
  useEffect(() => {
    fetchNetwork();
  }, [fetchNetwork]);

  // 数据加载完成后初始化和更新图表
  useEffect(() => {
    if (!loading && !error && nodes.length > 0) {
      // 延迟初始化，确保DOM已渲染
      const timer = setTimeout(() => {
        initChart();
        updateChart();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, error, nodes.length, initChart, updateChart]);

  // 筛选变化时更新图表
  useEffect(() => {
    if (chartInstance.current && !loading) {
      updateChart();
    }
  }, [selectedDynasty, loading, updateChart]);

  // 窗口大小变化时重绘
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 p-4 border-b bg-card shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          人物关系网络图谱
        </h1>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 p-3 border-b bg-card/50 overflow-x-auto shrink-0">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground shrink-0">朝代：</span>
        {dynasties.map((dynasty) => (
          <Badge
            key={dynasty}
            variant={selectedDynasty === dynasty ? 'default' : 'secondary'}
            className="cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
            onClick={() => setSelectedDynasty(dynasty)}
          >
            {dynasty}
          </Badge>
        ))}
      </div>

      {/* 统计信息 */}
      <div className="px-4 py-2 bg-muted/30 border-b shrink-0">
        <p className="text-sm text-muted-foreground text-center">
          共 <span className="font-semibold text-foreground">{filteredNodes.length}</span> 个人物，
          <span className="font-semibold text-foreground">{filteredLinks.length}</span> 条关系
          {selectedDynasty !== '全部' && ` · ${selectedDynasty}`}
        </p>
      </div>

      {/* 图谱区域 - 明确高度 */}
      <div className="relative flex-1 w-full" style={{ minHeight: '450px' }}>
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground">正在加载人物关系网络...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Info className="w-8 h-8 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchNetwork}>重新加载</Button>
          </div>
        ) : (
          <div
            ref={chartRef}
            className="w-full h-full"
            style={{ minHeight: '450px', width: '100%' }}
          />
        )}
      </div>

      {/* 图例说明 */}
      <div className="fixed bottom-20 right-3 bg-card/95 backdrop-blur border rounded-lg p-2.5 max-w-[180px] shadow-lg z-10">
        <p className="text-xs font-medium text-foreground mb-1.5">关系类型</p>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(RELATION_COLORS).slice(0, 8).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-3 h-0.5 rounded shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground truncate">{type}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">点击人物查看详情</p>
      </div>

      {/* 人物详情弹窗 */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
              {selectedPerson?.name}
              <Badge variant="secondary">{selectedPerson?.dynasty}</Badge>
            </DialogTitle>
            <DialogDescription>
              {selectedPerson?.role} · {selectedPerson?.birth_year} ~ {selectedPerson?.death_year}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPerson?.level_contents?.summary && (
            <div className="bg-muted/50 rounded-md p-3 shrink-0">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                {selectedPerson.level_contents.summary}
              </p>
            </div>
          )}

          {selectedPerson?.relations && selectedPerson.relations.length > 0 && (
            <div className="space-y-2 shrink-0">
              <p className="text-sm font-medium text-foreground">人物关系（{selectedPerson.relations.length}）</p>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {selectedPerson.relations.map((rel, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs mt-0.5"
                      style={{
                        borderColor: RELATION_COLORS[rel.relation_type] || '#9ca3af',
                        color: RELATION_COLORS[rel.relation_type] || '#9ca3af',
                      }}
                    >
                      {rel.relation_type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground block">{rel.related_name}</span>
                      {rel.description && (
                        <span className="text-xs text-muted-foreground block mt-0.5 leading-relaxed break-words">
                          {rel.description}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonNetworkPage;
