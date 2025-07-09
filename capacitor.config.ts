import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3ed7479fb1674da9a002a9abf1f25ec8',
  appName: 'spebit-visual-gateway',
  webDir: 'dist',
  server: {
    url: 'https://3ed7479f-b167-4da9-a002-a9abf1f25ec8.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;