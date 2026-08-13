import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lingua.assistant',
  appName: 'Lingua Assistant',
  webDir: 'apps/mobile/dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#101114'
  }
};

export default config;
