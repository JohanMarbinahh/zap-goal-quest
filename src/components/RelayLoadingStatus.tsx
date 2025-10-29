import { Spinner } from '@/components/ui/spinner';

interface RelayLoadingStatusProps {
  goalsLoaded: number;
}

export const RelayLoadingStatus = ({ goalsLoaded }: RelayLoadingStatusProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative">
        <Spinner size="lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">
            {goalsLoaded}
          </span>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-semibold">
          Loading Zap Goals...
        </h3>
      </div>
    </div>
  );
};
