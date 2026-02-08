/**
 * Application Configuration
 * Environment-based configuration and feature flags
 *
 * Architecture: SRS_01 § 9 - Configuration & Feature Flags
 */

export interface AppConfig {
  app: {
    name: string;
    version: string;
    env: 'development' | 'production' | 'test';
  };
  features: {
    aiGeneration: boolean;
    governance: boolean;
    collaboration: boolean; // Future
  };
  storage: {
    dbName: string;
    dbVersion: number;
  };
  performance: {
    lintDebounceMs: number;
    maxSpecSizeMb: number;
  };
  security: {
    maxTitleLength: number;
    maxDescriptionLength: number;
  };
}

const config: AppConfig = {
  app: {
    name: 'YASP',
    version: '1.0.0',
    env: (import.meta.env.MODE as any) || 'development',
  },
  features: {
    aiGeneration: import.meta.env.VITE_ENABLE_AI !== 'false',
    governance: import.meta.env.VITE_ENABLE_GOVERNANCE !== 'false',
    collaboration: false, // v2 feature
  },
  storage: {
    dbName: 'yasp_db_v1',
    dbVersion: 1,
  },
  performance: {
    lintDebounceMs: 500,
    maxSpecSizeMb: 10,
  },
  security: {
    maxTitleLength: 255,
    maxDescriptionLength: 2000,
  },
};

export default config;
