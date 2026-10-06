import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.password.manager',
  appName: 'Password Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Filesystem plugin config if needed
  }
};

export default config;
