import { useState } from 'react';
import { Template } from '../../../shared/types';

interface TemplateItemProps {
  template: Template;
  onPreview: (template: Template) => void;
}

const categoryLabels: Record<string, string> = {
  minimal: 'Minimal',
  fullstack: 'Full-Stack',
  backend: 'Backend',
  mobile: 'Mobile',
  safety: 'Safety',
  general: 'General',
};

const categoryClasses: Record<string, string> = {
  minimal: 'template-category-minimal',
  fullstack: 'template-category-fullstack',
  backend: 'template-category-backend',
  mobile: 'template-category-mobile',
  safety: 'template-category-safety',
  general: 'template-category-general',
};

/**
 * A draggable template item for the sidebar.
 * Can be dragged onto folder nodes to create a new file from the template.
 */
export function TemplateItem({ template, onPreview }: TemplateItemProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/template', JSON.stringify(template));
    e.dataTransfer.setData('text/plain', template.name);
    e.dataTransfer.effectAllowed = 'copy';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    onPreview(template);
  };

  return (
    <div
      className={`template-item ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      title={`${template.name}: ${template.description}\n\nDrag to a folder to create a new file, or click to preview.`}
    >
      <div className="flex items-center gap-2">
        <span className="text-base flex-shrink-0">📋</span>
        <span className="template-item-name">{template.name}</span>
        <span className={`template-item-category ${categoryClasses[template.category] || categoryClasses.general}`}>
          {categoryLabels[template.category] || template.category}
        </span>
      </div>
      <span className="template-item-desc pl-6">{template.description}</span>
    </div>
  );
}
