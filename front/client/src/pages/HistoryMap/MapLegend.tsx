import { Star, Circle, Square } from 'lucide-react';

const MapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur-sm rounded-lg shadow-md border border-border p-3 text-xs">
      <div className="font-serif font-semibold text-foreground mb-2 text-sm">
        图例
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative w-4 h-4 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary border-2 border-white shadow-sm" />
          </div>
          <span className="text-muted-foreground">文明中心</span>
        </div>
        <div className="flex items-center gap-2">
          <Star
            className="w-4 h-4"
            fill="#CD5C5C"
            stroke="#CD5C5C"
          />
          <span className="text-muted-foreground">历史事件</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-3 rounded-sm border border-[#3B82F6]"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.25)' }}
          />
          <span className="text-muted-foreground">文明疆域</span>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
