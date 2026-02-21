import { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { ToolIcon } from './ToolIcon';
import { AppSettings, Template, TemplateVariable } from '../../shared/types';
import {
  defaultTemplates,
  getTemplatesForTool,
  substituteVariables,
} from '../../shared/defaultTemplates';

interface NewFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (dirPath: string, fileName: string, toolId: string, content: string) => void;
  settings: AppSettings | null;
  defaultDirectory?: string;
  preselectedTemplate?: Template | null;
}

// Default file names for each tool
const toolDefaultFiles: Record<string, string> = {
  claude: 'CLAUDE.md',
  cursor: '.cursorrules',
  copilot: '.github/copilot-instructions.md',
  windsurf: '.windsurfrules',
  openai: 'AGENTS.md',
};

type Step = 'template' | 'details';

export function NewFileDialog({ isOpen, onClose, onCreateFile, settings, defaultDirectory, preselectedTemplate }: NewFileDialogProps) {
  const [step, setStep] = useState<Step>('template');
  const [dirPath, setDirPath] = useState('');
  const [selectedTool, setSelectedTool] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Get enabled tools from settings
  const enabledTools = settings?.toolProfiles.filter((t) => t.enabled) || [];

  // Get available templates based on selected tool
  const availableTemplates = useMemo(() => {
    if (!selectedTool) return defaultTemplates;
    return getTemplatesForTool(selectedTool);
  }, [selectedTool]);

  // Generate preview content
  const previewContent = useMemo(() => {
    if (!selectedTemplate) return '';
    return substituteVariables(selectedTemplate.content, variableValues);
  }, [selectedTemplate, variableValues]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDirPath(defaultDirectory || '');
      setSelectedTool(enabledTools[0]?.id || 'claude');
      setFileName(enabledTools[0] ? toolDefaultFiles[enabledTools[0].id] || 'CLAUDE.md' : 'CLAUDE.md');
      setError('');
      setShowPreview(false);

      // If a template is preselected, skip to details step
      if (preselectedTemplate) {
        setSelectedTemplate(preselectedTemplate);
        setStep('details');
      } else {
        setSelectedTemplate(null);
        setVariableValues({});
        setStep('template');
      }
    }
  }, [isOpen, defaultDirectory, preselectedTemplate]);

  // Update filename when tool changes
  useEffect(() => {
    if (selectedTool) {
      setFileName(toolDefaultFiles[selectedTool] || 'CLAUDE.md');
    }
  }, [selectedTool]);

  // Initialize variable values when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const initialValues: Record<string, string> = {};
      selectedTemplate.variables.forEach((v) => {
        initialValues[v.name] = v.placeholder;
      });
      setVariableValues(initialValues);
    }
  }, [selectedTemplate]);

  const handleSelectDirectory = async () => {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
      setDirPath(path);
      setError('');
    }
  };

  const handleSelectTemplate = (template: Template | null) => {
    setSelectedTemplate(template);
    if (template) {
      setStep('details');
    }
  };

  const handleSkipTemplate = () => {
    setSelectedTemplate(null);
    setStep('details');
  };

  const handleBack = () => {
    setStep('template');
    setShowPreview(false);
  };

  const handleCreate = () => {
    if (!dirPath) {
      setError('Please select a directory');
      return;
    }
    if (!fileName.trim()) {
      setError('Please enter a file name');
      return;
    }
    if (!selectedTool) {
      setError('Please select a tool');
      return;
    }

    // Check required variables
    if (selectedTemplate) {
      const missingRequired = selectedTemplate.variables
        .filter((v) => v.required && !variableValues[v.name]?.trim())
        .map((v) => v.label);

      if (missingRequired.length > 0) {
        setError(`Please fill in: ${missingRequired.join(', ')}`);
        return;
      }
    }

    const content = selectedTemplate ? previewContent : '';
    onCreateFile(dirPath, fileName.trim(), selectedTool, content);
  };

  const fullPath = dirPath && fileName ? `${dirPath}/${fileName}` : '';

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      minimal: 'Minimal',
      fullstack: 'Full-Stack',
      backend: 'Backend',
      mobile: 'Mobile',
      safety: 'Safety',
      general: 'General',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      minimal: 'bg-light-surface text-gray-700 dark:bg-surface-hover dark:text-content-secondary',
      fullstack: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      backend: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      mobile: 'bg-ai/15 text-ai-deep dark:bg-ai/25 dark:text-ai-light',
      safety: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      general: 'bg-light-surface text-gray-700 dark:bg-surface-hover dark:text-content-secondary',
    };
    return colors[category] || colors.general;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'template' ? 'Choose a Template' : 'New Context File'}
      width="lg"
    >
      {step === 'template' ? (
        <div className="space-y-4">
          {/* Tool filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-content-tertiary">Filter by tool:</span>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="px-2 py-1 text-sm bg-light-surface dark:bg-surface-bg border border-light-border dark:border-surface-border rounded-md text-gray-700 dark:text-content-secondary"
            >
              <option value="">All Tools</option>
              {enabledTools.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.name}
                </option>
              ))}
            </select>
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
            {/* Blank file option */}
            <button
              onClick={handleSkipTemplate}
              className="text-left p-4 border-2 border-dashed border-light-border dark:border-surface-border rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-light-surface dark:hover:bg-surface-card transition-colors"
            >
              <div className="mb-2 text-gray-400 dark:text-content-tertiary"><ToolIcon toolId="document" size={24} /></div>
              <div className="font-medium text-gray-700 dark:text-content-secondary">Blank File</div>
              <div className="text-sm text-content-tertiary mt-1">
                Start from scratch
              </div>
            </button>

            {/* Template cards */}
            {availableTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="text-left p-4 border border-light-border dark:border-surface-border rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-light-surface dark:hover:bg-surface-card transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(template.category)}`}>
                    {getCategoryLabel(template.category)}
                  </span>
                </div>
                <div className="font-medium text-gray-700 dark:text-content-secondary">{template.name}</div>
                <div className="text-sm text-content-tertiary mt-1 line-clamp-2">
                  {template.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Back button and template info */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
            >
              <span>←</span> Change template
            </button>
            {selectedTemplate && (
              <span className="text-sm text-content-tertiary">
                Using: <strong>{selectedTemplate.name}</strong>
              </span>
            )}
          </div>

          {/* Directory selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-content-secondary mb-1">
              Location
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={dirPath}
                readOnly
                placeholder="Select a directory..."
                className="flex-1 px-3 py-2 text-sm bg-light-surface dark:bg-surface-bg border border-light-border dark:border-surface-border rounded-md text-gray-700 dark:text-content-secondary"
              />
              <button
                onClick={handleSelectDirectory}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Tool selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-content-secondary mb-1">
              Tool
            </label>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-light-surface dark:bg-surface-bg border border-light-border dark:border-surface-border rounded-md text-gray-700 dark:text-content-secondary"
            >
              {enabledTools.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.name}
                </option>
              ))}
            </select>
          </div>

          {/* File name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-content-secondary mb-1">
              File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-light-surface dark:bg-surface-bg border border-light-border dark:border-surface-border rounded-md text-gray-700 dark:text-content-secondary"
            />
          </div>

          {/* Template variables */}
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="border-t border-light-border dark:border-surface-border pt-4">
              <div className="text-sm font-medium text-gray-700 dark:text-content-secondary mb-3">
                Template Variables
              </div>
              <div className="space-y-3">
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable.name}>
                    <label className="block text-sm text-gray-600 dark:text-content-tertiary mb-1">
                      {variable.label}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      value={variableValues[variable.name] || ''}
                      onChange={(e) =>
                        setVariableValues((prev) => ({
                          ...prev,
                          [variable.name]: e.target.value,
                        }))
                      }
                      placeholder={variable.placeholder}
                      className="w-full px-3 py-2 text-sm bg-light-surface dark:bg-surface-bg border border-light-border dark:border-surface-border rounded-md text-gray-700 dark:text-content-secondary"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview toggle */}
          {selectedTemplate && (
            <div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                {showPreview ? '▼' : '▶'} Preview content
              </button>
              {showPreview && (
                <div className="mt-2 bg-light-surface dark:bg-surface-bg rounded-md border border-light-border dark:border-surface-border max-h-[200px] overflow-auto">
                  <pre className="p-3 text-xs font-mono text-gray-700 dark:text-content-secondary whitespace-pre-wrap">
                    {previewContent}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Full path preview */}
          {fullPath && (
            <div className="bg-light-surface dark:bg-surface-bg rounded-md p-3 border border-light-border dark:border-surface-border">
              <div className="text-xs text-content-tertiary mb-1">Full path:</div>
              <div className="text-sm font-mono text-gray-700 dark:text-content-secondary break-all">
                {fullPath}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-content-secondary bg-light-surface dark:bg-surface-hover hover:bg-light-border dark:hover:bg-surface-hover rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
