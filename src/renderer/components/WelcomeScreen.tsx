import { useState } from 'react';
import { ToolIcon } from './ToolIcon';

interface WelcomeScreenProps {
  onComplete: () => void;
  onScanDirectory: () => void;
  onCreateFile: () => void;
}

type Step = 'welcome' | 'scan' | 'ready';

export function WelcomeScreen({ onComplete, onScanDirectory, onCreateFile }: WelcomeScreenProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [hasScanned, setHasScanned] = useState(false);

  const handleScanDirectory = async () => {
    onScanDirectory();
    setHasScanned(true);
    setStep('ready');
    window.electronAPI.trackEvent('onboarding_step', { step: 'ready', step_number: 3 });
  };

  const handleSkipScan = () => {
    setStep('ready');
    window.electronAPI.trackEvent('onboarding_step', { step: 'ready_skipped', step_number: 3 });
  };

  const handleCreateFile = () => {
    onCreateFile();
    onComplete();
  };

  const handleFinish = () => {
    onComplete();
  };

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-lg w-full mx-4">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {(['welcome', 'scan', 'ready'] as const).map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full transition-colors ${
                    step === s
                      ? 'bg-brand-teal'
                      : ['welcome', 'scan', 'ready'].indexOf(step) > i
                        ? 'bg-teal-300'
                        : 'bg-light-border dark:bg-surface-border'
                  }`}
                />
                {i < 2 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      ['welcome', 'scan', 'ready'].indexOf(step) > i
                        ? 'bg-teal-300'
                        : 'bg-light-border dark:bg-surface-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-light-bg dark:bg-surface-card rounded-xl shadow-lg border border-light-border dark:border-surface-border p-8">
          {step === 'welcome' && (
            <div className="text-center">
              <div className="text-5xl mb-4">
                <span role="img" aria-label="waving hand">
                  Welcome
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-content-primary mb-3">
                Welcome to Tokencentric
              </h1>
              <p className="text-gray-600 dark:text-content-tertiary mb-6">
                Manage your AI coding assistant context files in one place.
                Track token counts, edit with live preview, and create from templates.
              </p>

              <div className="space-y-3 text-left mb-8">
                <div className="flex items-start gap-3 p-3 bg-light-surface dark:bg-surface-bg rounded-lg">
                  <ToolIcon toolId="search" size={20} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-content-primary">Discover Files</div>
                    <div className="text-sm text-gray-600 dark:text-content-tertiary">
                      Scan directories for CLAUDE.md, .cursorrules, and more
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-light-surface dark:bg-surface-bg rounded-lg">
                  <ToolIcon toolId="chart" size={20} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-content-primary">Track Tokens</div>
                    <div className="text-sm text-gray-600 dark:text-content-tertiary">
                      See accurate token counts with color-coded indicators
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-light-surface dark:bg-surface-bg rounded-lg">
                  <ToolIcon toolId="markdown" size={20} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-content-primary">Edit & Preview</div>
                    <div className="text-sm text-gray-600 dark:text-content-tertiary">
                      Monaco editor with markdown preview
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep('scan');
                  window.electronAPI.trackEvent('onboarding_step', { step: 'scan', step_number: 2 });
                }}
                className="w-full px-6 py-3 text-lg font-medium text-white bg-brand-teal hover:bg-brand-teal-bright rounded-lg transition-colors"
              >
                Get Started
              </button>
            </div>
          )}

          {step === 'scan' && (
            <div className="text-center">
              <div className="mb-4"><ToolIcon toolId="folder-open" size={48} /></div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-content-primary mb-3">
                Add Your First Directory
              </h1>
              <p className="text-gray-600 dark:text-content-tertiary mb-6">
                Point Tokencentric at a folder containing your projects.
                It will find all AI context files automatically.
              </p>

              <div className="bg-light-surface dark:bg-surface-bg rounded-lg p-4 mb-6 text-left">
                <div className="text-sm font-medium text-gray-700 dark:text-content-secondary mb-2">
                  We'll look for:
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
                    CLAUDE.md
                  </span>
                  <span className="px-2 py-1 text-xs bg-light-border dark:bg-surface-hover text-gray-700 dark:text-content-secondary rounded">
                    .cursorrules
                  </span>
                  <span className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded">
                    copilot-instructions.md
                  </span>
                  <span className="px-2 py-1 text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded">
                    .windsurfrules
                  </span>
                  <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                    AGENTS.md
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleScanDirectory}
                  className="w-full px-6 py-3 text-lg font-medium text-white bg-brand-teal hover:bg-brand-teal-bright rounded-lg transition-colors"
                >
                  Choose Directory
                </button>
                <button
                  onClick={handleSkipScan}
                  className="w-full px-6 py-3 text-sm font-medium text-gray-600 dark:text-content-tertiary hover:text-gray-800 dark:hover:text-content-primary transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {step === 'ready' && (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-content-primary mb-3">
                {hasScanned ? "You're All Set!" : "Ready When You Are"}
              </h1>
              <p className="text-gray-600 dark:text-content-tertiary mb-6">
                {hasScanned
                  ? "Your files have been discovered. Start editing or create a new context file."
                  : "You can scan for files or create a new one anytime from the sidebar."}
              </p>

              <div className="bg-light-surface dark:bg-surface-bg rounded-lg p-4 mb-6 text-left">
                <div className="text-sm font-medium text-gray-700 dark:text-content-secondary mb-3">
                  Quick tips:
                </div>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-content-tertiary">
                  <li className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-light-border dark:bg-surface-hover rounded text-xs">⌘N</kbd>
                    <span>Create new file</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-light-border dark:bg-surface-hover rounded text-xs">⌘S</kbd>
                    <span>Save current file</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-light-border dark:bg-surface-hover rounded text-xs">⌘,</kbd>
                    <span>Open settings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-light-border dark:bg-surface-hover rounded text-xs">⌘⇧O</kbd>
                    <span>Scan directory</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                {!hasScanned && (
                  <button
                    onClick={handleCreateFile}
                    className="w-full px-6 py-3 text-lg font-medium text-white bg-brand-teal hover:bg-brand-teal-bright rounded-lg transition-colors"
                  >
                    Create Your First File
                  </button>
                )}
                <button
                  onClick={handleFinish}
                  className={`w-full px-6 py-3 font-medium rounded-lg transition-colors ${
                    hasScanned
                      ? 'text-lg text-white bg-brand-teal hover:bg-brand-teal-bright'
                      : 'text-sm text-gray-600 dark:text-content-tertiary hover:text-gray-800 dark:hover:text-content-primary'
                  }`}
                >
                  {hasScanned ? 'Start Using Tokencentric' : 'Skip for now'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-content-tertiary">
          Made with ❤️ by{' '}
          <a
            href="https://helsky-labs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-teal hover:underline"
          >
            Helsky Labs
          </a>
        </div>
      </div>
    </div>
  );
}
