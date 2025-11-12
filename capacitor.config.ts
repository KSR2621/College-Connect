import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campusconnect.app',
  appName: 'CampusConnect',
  webDir: 'dist', // This should match your build output directory (e.g., 'build' for Create React App)
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF'
    }
  }
};

export default config;