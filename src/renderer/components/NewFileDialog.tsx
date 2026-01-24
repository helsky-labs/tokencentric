import { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
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

export function NewFileDialog({ isOpen, onClose, onCreateFile, settings, defaultDirectory }: NewFileDialogProps) {
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
      setStep('template');
      setDirPath(defaultDirectory || '');
      setSelectedTool(enabledTools[0]?.id || 'claude');
      setFileName(enabledTools[0] ? toolDefaultFiles[enabledTools[0].id] || 'CLAUDE.md' : 'CLAUDE.md');
      setError('');
      setSelectedTemplate(null);
      setVariableValues({});
      setShowPreview(false);
    }
  }, [isOpen, defaultDirectory]);

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
      minimal: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      fullstack: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      backend: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      mobile: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      safety: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      general: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
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
            <span className="text-sm text-gray-500 dark:text-gray-400">Filter by tool:</span>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="px-2 py-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
            >
              <option value="">All Tools</option>
              {enabledTools.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.icon} {tool.name}
                </option>
              ))}
            </select>
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
            {/* Blank file option */}
            <button
              onClick={handleSkipTemplate}
              className="text-left p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="text-2xl mb-2">📄</div>
              <div className="font-medium text-gray-700 dark:text-gray-300">Blank File</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Start from scratch
              </div>
            </button>

            {/* Template cards */}
            {availableTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(template.category)}`}>
                    {getCategoryLabel(template.category)}
                  </span>
                </div>
                <div className="font-medium text-gray-700 dark:text-gray-300">{template.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
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
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Using: <strong>{selectedTemplate.name}</strong>
              </span>
            )}
          </div>

          {/* Directory selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={dirPath}
                readOnly
                placeholder="Select a directory..."
                className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tool
            </label>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
            >
              {enabledTools.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.icon} {tool.name}
                </option>
              ))}
            </select>
          </div>

          {/* File name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
            />
          </div>

          {/* Template variables */}
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Template Variables
              </div>
              <div className="space-y-3">
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable.name}>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
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
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
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
                <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 max-h-[200px] overflow-auto">
                  <pre className="p-3 text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {previewContent}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Full path preview */}
          {fullPath && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Full path:</div>
              <div className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
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
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
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
