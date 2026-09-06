import { getEraById, getRegionById } from '@client/src/data/eras';
import type { EraId, RegionId } from '@client/src/types/history';

interface EraRegionBadgesProps {
  era: EraId;
  region: RegionId;
}

const EraRegionBadges: React.FC<EraRegionBadgesProps> = ({ era, region }) => {
  const eraInfo = getEraById(era);
  const regionInfo = getRegionById(region);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {eraInfo && (
        <span
          className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full text-white"
          style={{ backgroundColor: eraInfo.color }}
        >
          {eraInfo.name}
        </span>
      )}
      {regionInfo && (
        <span
          className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full text-white"
          style={{ backgroundColor: regionInfo.color }}
        >
          {regionInfo.name}
        </span>
      )}
    </div>
  );
};

export default EraRegionBadges;
