import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shifat.flux',
  appName: 'FLUX',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      '172.16.50.*',
      '10.16.100.*',
      'autoembed.co',
      '*.autoembed.co',
      'corsproxy.io'
    ]
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#1E1F22',
      style: 'DARK',
      overlaysWebView: false
    }
  }
};

export default config;
