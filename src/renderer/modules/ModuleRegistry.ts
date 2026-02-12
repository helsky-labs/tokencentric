import { ToolModule } from '../../shared/types';
import { claudeModule } from './claude';

// All registered tool modules
const modules: ToolModule[] = [claudeModule];

export function getRegisteredModules(): ToolModule[] {
  return modules;
}

export function getModuleById(id: string): ToolModule | undefined {
  return modules.find((m) => m.id === id);
}
