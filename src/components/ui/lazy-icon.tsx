import React, { lazy, Suspense } from 'react';
import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { Skeleton } from './skeleton';

interface LazyIconProps extends Omit<LucideProps, 'ref'> {
  name: keyof typeof dynamicIconImports;
  fallbackSize?: number;
}

const LazyIcon = ({ name, fallbackSize = 24, ...props }: LazyIconProps) => {
  const LucideIcon = lazy(dynamicIconImports[name]);

  return (
    <Suspense 
      fallback={
        <Skeleton 
          className="rounded" 
          style={{ width: fallbackSize, height: fallbackSize }} 
        />
      }
    >
      <LucideIcon {...props} />
    </Suspense>
  );
};

export default LazyIcon;
