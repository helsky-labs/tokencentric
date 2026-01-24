import { useState } from 'react';
import { Template } from '../../../shared/types';
import { defaultTemplates } from '../../../shared/defaultTemplates';
import { SidebarSection } from './SidebarSection';
import { TemplateItem } from './TemplateItem';
import { Modal } from '../Modal';

interface TemplatesSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  onCreateFromTemplate: (template: Template, directory?: string) => void;
}

/**
 * Templates library section in the sidebar.
 * Shows available templates that can be dragged onto folders.
 */
export function TemplatesSection({
  isExpanded,
  onToggle,
  onCreateFromTemplate,
}: TemplatesSectionProps) {
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  const handleUseTemplate = () => {
    if (previewTemplate) {
      onCreateFromTemplate(previewTemplate);
      setPreviewTemplate(null);
    }
  };

  return (
    <>
      <SidebarSection
        title="Templates"
        isExpanded={isExpanded}
        onToggle={onToggle}
        badge={defaultTemplates.length}
        variant="teal"
      >
        <div className="px-1 max-h-64 overflow-y-auto">
          {defaultTemplates.map((template) => (
            <TemplateItem
              key={template.id}
              template={template}
              onPreview={handlePreview}
            />
          ))}
        </div>
        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
          Drag a template to a folder to create a file
        </div>
      </SidebarSection>

      {/* Template Preview Modal */}
      <Modal
        isOpen={previewTemplate !== null}
        onClose={handleClosePreview}
        title={previewTemplate?.name || 'Template Preview'}
        width="lg"
      >
        {previewTemplate && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {previewTemplate.description}
              </p>
            </div>

            {previewTemplate.variables.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Variables
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {previewTemplate.variables.map((v) => (
                    <li key={v.name} className="flex items-center gap-2">
                      <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                        {`{{${v.name}}}`}
                      </code>
                      <span>{v.label}</span>
                      {v.required && (
                        <span className="text-red-500 text-xs">*required</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content Preview
              </h4>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 max-h-64 overflow-auto">
                <pre className="p-3 text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {previewTemplate.content}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClosePreview}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleUseTemplate}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-md transition-colors"
              >
                Use Template
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
