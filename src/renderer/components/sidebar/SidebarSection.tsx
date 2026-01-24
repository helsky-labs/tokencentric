import React from 'react';

export type SidebarSectionVariant = 'default' | 'purple' | 'teal';

interface SidebarSectionProps {
  title: string;
  subtitle?: string;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  variant?: SidebarSectionVariant;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const variantClasses: Record<SidebarSectionVariant, string> = {
  default: 'sidebar-section-header-default',
  purple: 'sidebar-section-header-purple',
  teal: 'sidebar-section-header-teal',
};

/**
 * Reusable collapsible section component for the sidebar.
 * Used for Global Config, Templates, and Project Files sections.
 */
export function SidebarSection({
  title,
  subtitle,
  isExpanded,
  onToggle,
  badge,
  variant = 'default',
  actions,
  children,
}: SidebarSectionProps) {
  return (
    <div className="sidebar-section">
      <div
        className={`sidebar-section-header ${variantClasses[variant]}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <span className={`sidebar-section-chevron ${isExpanded ? 'expanded' : ''}`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <span className="flex-1 truncate">{title}</span>
        {subtitle && (
          <span className="sidebar-section-subtitle">{subtitle}</span>
        )}
        {badge && <span className="sidebar-section-badge">{badge}</span>}
        {actions && (
          <div
            className="sidebar-section-actions"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>
      {isExpanded && (
        <div className="sidebar-section-content">
          {children}
        </div>
      )}
    </div>
  );
}
