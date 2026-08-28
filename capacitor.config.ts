import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lingua.assistant',
  appName: 'Lingua Assistant',
  webDir: 'apps/mobile/dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#020617',
    allowMixedContent: false
  }
};

export default config;
