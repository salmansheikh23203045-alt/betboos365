import * as fs from 'fs';
import * as path from 'path';

const STATE_FILE = path.join(__dirname, 'migration_state.json');

export interface MigrationState {
  [model: string]: string | null; // last processed ID
}

export function loadState(): MigrationState {
  if (!fs.existsSync(STATE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
}

export function saveState(state: MigrationState) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}
