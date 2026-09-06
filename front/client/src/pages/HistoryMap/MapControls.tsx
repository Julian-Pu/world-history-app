import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
}) => {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomIn}
        aria-label="放大地图"
        className="bg-card/90 backdrop-blur-sm"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomOut}
        aria-label="缩小地图"
        className="bg-card/90 backdrop-blur-sm"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onReset}
        aria-label="重置视图"
        className="bg-card/90 backdrop-blur-sm"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default MapControls;
