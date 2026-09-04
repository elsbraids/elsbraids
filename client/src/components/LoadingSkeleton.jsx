function LoadingSkeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-[#eadde2] ${className}`} aria-hidden="true" />;
}

export function CardGridSkeleton({ count = 3, className = '' }) {
  return (
    <div className={`grid gap-6 md:grid-cols-2 xl:grid-cols-3 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <LoadingSkeleton key={index} className="h-[340px]" />
      ))}
    </div>
  );
}

export function ContentSkeleton({ className = '' }) {
  return <LoadingSkeleton className={className} />;
}

export default LoadingSkeleton;