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
    // Bug fix (Android device testing, issues #1/#5): the app's WebView
    // origin is "https://localhost" (androidScheme above). A user-entered
    // local gateway address (see ChatTab's gateway settings field /
    // lib/config.ts) is necessarily a plain http://192.168.x.x:PORT LAN
    // address - Capacitor/Android has no way to issue it a real TLS cert.
    // With this left false, every such fetch is silently blocked as mixed
    // content, which looks identical to "gateway unreachable". This alone
    // isn't sufficient though - see android/app/src/main/res/xml/
    // network_security_config.xml for the matching cleartext-traffic
    // permission the OS layer also requires.
    allowMixedContent: true
  }
};

export default config;
