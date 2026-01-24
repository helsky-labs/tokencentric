import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { AppSettings, AISettings, AIProvider, defaultAISettings } from '../../shared/types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings | null;
  onSaveSettings: (settings: Partial<AppSettings>) => void;
}

type Tab = 'scan' | 'tools' | 'appearance' | 'ai' | 'privacy';

export function SettingsDialog({ isOpen, onClose, settings, onSaveSettings }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const [scanPaths, setScanPaths] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [newExclusion, setNewExclusion] = useState('');
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [aiSettings, setAiSettings] = useState<AISettings>(defaultAISettings);
  const [testingProvider, setTestingProvider] = useState<AIProvider | null>(null);
  const [testResult, setTestResult] = useState<{ provider: AIProvider; success: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings when dialog opens
  useEffect(() => {
    if (isOpen && settings) {
      setScanPaths(settings.scanPaths || []);
      setExclusions(settings.exclusions || []);
      setTheme(settings.theme);
      setEditorFontSize(settings.editorFontSize);
      setAnalyticsEnabled(settings.analyticsEnabled ?? true);
      setAiSettings(settings.ai || defaultAISettings);
      setTestResult(null);
      setHasChanges(false);
    }
  }, [isOpen, settings]);

  const handleAddScanPath = async () => {
    const path = await window.electronAPI.selectDirectory();
    if (path && !scanPaths.includes(path)) {
      setScanPaths([...scanPaths, path]);
      setHasChanges(true);
    }
  };

  const handleRemoveScanPath = (pathToRemove: string) => {
    setScanPaths(scanPaths.filter((p) => p !== pathToRemove));
    setHasChanges(true);
  };

  const handleAddExclusion = () => {
    const trimmed = newExclusion.trim();
    if (trimmed && !exclusions.includes(trimmed)) {
      setExclusions([...exclusions, trimmed]);
      setNewExclusion('');
      setHasChanges(true);
    }
  };

  const handleRemoveExclusion = (exclusionToRemove: string) => {
    setExclusions(exclusions.filter((e) => e !== exclusionToRemove));
    setHasChanges(true);
  };

  const handleThemeChange = (newTheme: 'system' | 'light' | 'dark') => {
    setTheme(newTheme);
    setHasChanges(true);
  };

  const handleFontSizeChange = (size: number) => {
    setEditorFontSize(size);
    setHasChanges(true);
  };

  const handleAnalyticsChange = (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    setHasChanges(true);
  };

  // AI Settings handlers
  const handleAiProviderToggle = (provider: AIProvider, enabled: boolean) => {
    setAiSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers[provider],
          enabled,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleAiApiKeyChange = (provider: AIProvider, apiKey: string) => {
    setAiSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers[provider],
          apiKey,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleAiModelChange = (provider: AIProvider, model: string) => {
    setAiSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers[provider],
          model,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleAiBaseUrlChange = (provider: AIProvider, baseUrl: string) => {
    setAiSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers[provider],
          baseUrl,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleDefaultProviderChange = (provider: AIProvider) => {
    setAiSettings((prev) => ({
      ...prev,
      defaultProvider: provider,
    }));
    setHasChanges(true);
  };

  const handleTestConnection = async (provider: AIProvider) => {
    setTestingProvider(provider);
    setTestResult(null);
    try {
      const result = await window.electronAPI.testAiConnection(provider, aiSettings.providers[provider]);
      setTestResult({ provider, success: result.success, message: result.message });
    } catch (error) {
      setTestResult({
        provider,
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      scanPaths,
      exclusions,
      theme,
      editorFontSize,
      analyticsEnabled,
      ai: aiSettings,
    });
    setHasChanges(false);
    onClose();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'scan', label: 'Scan Paths' },
    { id: 'tools', label: 'Exclusions' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'ai', label: 'AI Providers' },
    { id: 'privacy', label: 'Privacy' },
  ];

  // Model options for each provider
  const modelOptions: Record<AIProvider, string[]> = {
    anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    ollama: ['llama3.2', 'llama3.1', 'codellama', 'mistral', 'mixtral'],
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" width="lg">
      <div className="flex gap-4 min-h-[400px]">
        {/* Tab navigation */}
        <div className="w-32 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 pr-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md mb-1 transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'scan' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Scan Directories
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Add directories to scan for AI context files. Tokencentric will search these
                  locations for CLAUDE.md, .cursorrules, and other context files.
                </p>
                <button
                  onClick={handleAddScanPath}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
                >
                  + Add Directory
                </button>
              </div>

              {scanPaths.length > 0 ? (
                <div className="space-y-2">
                  {scanPaths.map((path) => (
                    <div
                      key={path}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700"
                    >
                      <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                        {path}
                      </span>
                      <button
                        onClick={() => handleRemoveScanPath(path)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  No scan directories configured.
                  <br />
                  Add a directory to get started.
                </div>
              )}
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exclusion Patterns
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Directories and files matching these patterns will be skipped during scanning.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newExclusion}
                    onChange={(e) => setNewExclusion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddExclusion()}
                    placeholder="e.g., node_modules, .git"
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                  />
                  <button
                    onClick={handleAddExclusion}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {exclusions.map((exclusion) => (
                  <span
                    key={exclusion}
                    className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md"
                  >
                    {exclusion}
                    <button
                      onClick={() => handleRemoveExclusion(exclusion)}
                      className="p-0.5 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </h3>
                <div className="flex gap-2">
                  {(['system', 'light', 'dark'] as const).map((themeOption) => (
                    <button
                      key={themeOption}
                      onClick={() => handleThemeChange(themeOption)}
                      className={`px-4 py-2 text-sm rounded-md border transition-colors capitalize ${
                        theme === themeOption
                          ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {themeOption}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Editor Font Size
                </h3>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={editorFontSize}
                    onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 w-12 text-right">
                    {editorFontSize}px
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Providers
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Configure AI providers to generate, improve, and summarize context files.
                  Your API keys are stored locally and never sent to our servers.
                </p>
              </div>

              {/* Default Provider Selection */}
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Default Provider
                </label>
                <select
                  value={aiSettings.defaultProvider}
                  onChange={(e) => handleDefaultProviderChange(e.target.value as AIProvider)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                >
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>

              {/* Anthropic */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🟠</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Anthropic</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={aiSettings.providers.anthropic.enabled}
                    onClick={() => handleAiProviderToggle('anthropic', !aiSettings.providers.anthropic.enabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      aiSettings.providers.anthropic.enabled
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        aiSettings.providers.anthropic.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {aiSettings.providers.anthropic.enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">API Key</label>
                      <input
                        type="password"
                        value={aiSettings.providers.anthropic.apiKey || ''}
                        onChange={(e) => handleAiApiKeyChange('anthropic', e.target.value)}
                        placeholder="sk-ant-..."
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Model</label>
                      <select
                        value={aiSettings.providers.anthropic.model}
                        onChange={(e) => handleAiModelChange('anthropic', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                      >
                        {modelOptions.anthropic.map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleTestConnection('anthropic')}
                      disabled={testingProvider === 'anthropic' || !aiSettings.providers.anthropic.apiKey}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testingProvider === 'anthropic' ? 'Testing...' : 'Test Connection'}
                    </button>
                    {testResult?.provider === 'anthropic' && (
                      <p className={`text-xs ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {testResult.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* OpenAI */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🟢</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">OpenAI</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={aiSettings.providers.openai.enabled}
                    onClick={() => handleAiProviderToggle('openai', !aiSettings.providers.openai.enabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      aiSettings.providers.openai.enabled
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        aiSettings.providers.openai.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {aiSettings.providers.openai.enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">API Key</label>
                      <input
                        type="password"
                        value={aiSettings.providers.openai.apiKey || ''}
                        onChange={(e) => handleAiApiKeyChange('openai', e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Model</label>
                      <select
                        value={aiSettings.providers.openai.model}
                        onChange={(e) => handleAiModelChange('openai', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                      >
                        {modelOptions.openai.map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleTestConnection('openai')}
                      disabled={testingProvider === 'openai' || !aiSettings.providers.openai.apiKey}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testingProvider === 'openai' ? 'Testing...' : 'Test Connection'}
                    </button>
                    {testResult?.provider === 'openai' && (
                      <p className={`text-xs ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {testResult.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Ollama */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🦙</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Ollama (Local)</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={aiSettings.providers.ollama.enabled}
                    onClick={() => handleAiProviderToggle('ollama', !aiSettings.providers.ollama.enabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      aiSettings.providers.ollama.enabled
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        aiSettings.providers.ollama.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {aiSettings.providers.ollama.enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Base URL</label>
                      <input
                        type="text"
                        value={aiSettings.providers.ollama.baseUrl || 'http://localhost:11434'}
                        onChange={(e) => handleAiBaseUrlChange('ollama', e.target.value)}
                        placeholder="http://localhost:11434"
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Model</label>
                      <select
                        value={aiSettings.providers.ollama.model}
                        onChange={(e) => handleAiModelChange('ollama', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                      >
                        {modelOptions.ollama.map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleTestConnection('ollama')}
                      disabled={testingProvider === 'ollama'}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testingProvider === 'ollama' ? 'Testing...' : 'Test Connection'}
                    </button>
                    {testResult?.provider === 'ollama' && (
                      <p className={`text-xs ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {testResult.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usage Analytics
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Help improve Tokencentric by sending anonymous usage data. We collect only
                  basic usage statistics like feature usage counts. No personal data or file
                  contents are ever transmitted.
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={analyticsEnabled}
                    onClick={() => handleAnalyticsChange(!analyticsEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      analyticsEnabled
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        analyticsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Send anonymous usage data
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What We Collect
                </h3>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li>App launches and session duration</li>
                  <li>Features used (file creation, deletion, scanning)</li>
                  <li>Error counts (not error content)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What We Never Collect
                </h3>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li>File contents or names</li>
                  <li>Directory paths</li>
                  <li>Personal information</li>
                  <li>IP addresses (anonymized by analytics provider)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with save button */}
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            hasChanges
              ? 'text-white bg-blue-500 hover:bg-blue-600'
              : 'text-gray-400 bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
          }`}
        >
          Save Changes
        </button>
      </div>
    </Modal>
  );
}
