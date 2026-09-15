import React from "react";

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = "" }) => (
  <div className={`flex flex-col animate-pulse ${className}`}>
    <div className="relative aspect-square w-full bg-[#EFEFEF] mb-4" />
    <div className="flex flex-col gap-1.5">
      <div className="h-3 w-3/4 bg-neutral-200 rounded" />
      <div className="h-3 w-1/2 bg-neutral-200 rounded mt-1" />
    </div>
  </div>
);
