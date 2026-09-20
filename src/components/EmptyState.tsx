import React from "react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    href: string;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1A1A1A] font-sans mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm sm:text-base text-[#5E5E5E] max-w-md leading-relaxed mb-8">
          {subtitle}
        </p>
      )}
      {action && (
        <Link
          to={action.href}
          className="inline-flex items-center px-6 py-3 bg-[#1A1A1A] text-white text-xs font-sans font-medium uppercase tracking-widest hover:bg-neutral-800 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
};
