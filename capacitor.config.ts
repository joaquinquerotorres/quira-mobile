import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quira.app',
  appName: 'quira-mobile',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      providers: ['google.com', 'apple.com'],
    },
  },
};

export default config;
