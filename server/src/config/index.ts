import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const rootEnvPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: true });
}

export interface Config {
  videoDir: string;
  subtitleDir: string;
  port: number;
}

const DEFAULT_CONFIG: Config = {
  videoDir: process.env.VIDEO_DIR || '',
  subtitleDir: process.env.SUBTITLE_DIR || '',
  port: Number(process.env.PORT) || 3000,
};

let currentConfig: Config = { ...DEFAULT_CONFIG };
const configFilePath = path.resolve(process.cwd(), 'config.json');

function initConfig() {
  if (fs.existsSync(configFilePath)) {
    try {
      const data = fs.readFileSync(configFilePath, 'utf-8');
      const loaded = JSON.parse(data);
      currentConfig = {
        videoDir: loaded.videoDir !== undefined ? loaded.videoDir : DEFAULT_CONFIG.videoDir,
        subtitleDir: loaded.subtitleDir !== undefined ? loaded.subtitleDir : DEFAULT_CONFIG.subtitleDir,
        port: loaded.port !== undefined ? Number(loaded.port) : DEFAULT_CONFIG.port,
      };
    } catch (err) {
      console.error('Failed to parse config.json, using defaults.', err);
    }
  } else {
    currentConfig = { ...DEFAULT_CONFIG };
  }
}

initConfig();

export function getConfig(): Config {
  return currentConfig;
}

export function updateConfig(newConfig: Partial<Config>): Config {
  currentConfig = {
    ...currentConfig,
    ...newConfig,
  };
  
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(currentConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write config.json', err);
  }
  
  return currentConfig;
}

export function resetConfig(): void {
  currentConfig = { ...DEFAULT_CONFIG };
  if (fs.existsSync(configFilePath)) {
    try {
      fs.unlinkSync(configFilePath);
    } catch (err) {
      // ignore
    }
  }
}
