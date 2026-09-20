import React, { useRef, useEffect, useState } from "react";
import { SkeletonCard } from "./SkeletonCard";

interface LazyMountProps {
  children: React.ReactNode;
  skeletonCount?: number;
}

export const LazyMount: React.FC<LazyMountProps> = ({ children, skeletonCount = 4 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!visible) {
    return (
      <div ref={ref} className="py-16 md:py-24 bg-[#FAFAF9] w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[10px] px-[10px]">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
