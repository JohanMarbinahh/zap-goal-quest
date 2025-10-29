import { Spinner } from '@/components/ui/spinner';

export const RelayLoadingStatus = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <Spinner size="lg" />
      <div className="text-center">
        <h3 className="text-xl font-semibold">
          Loading Zap Goals...
        </h3>
      </div>
    </div>
  );
};
