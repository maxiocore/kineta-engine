import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'sa.ash_holding.app',
  appName: 'ASH HOLDING',
  webDir: 'dist',
  server: {
    url: 'https://ash-holding.sa',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
    },
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;