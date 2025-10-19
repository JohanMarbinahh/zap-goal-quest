import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const GoalCardSkeleton = () => {
  return (
    <Card className="overflow-hidden border-border/50">
      {/* Image skeleton */}
      <Skeleton className="aspect-video w-full" />
      
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar skeleton */}
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            {/* Title skeleton */}
            <Skeleton className="h-6 w-3/4" />
            {/* Author skeleton */}
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        
        {/* Progress section skeleton */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-20 ml-auto" />
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {/* Button skeleton */}
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
};
