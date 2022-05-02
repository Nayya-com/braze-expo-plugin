import { ConfigPlugin, withInfoPlist } from '@expo/config-plugins';

/**
 * Add "Background Modes -> Remote notifications" and "App Group" permissions
 * @see https://documentation.onesignal.com/docs/react-native-sdk-setup#step-4-install-for-ios-using-cocoapods-for-ios-apps
 */
export const withRemoteNotificationsPermissions: ConfigPlugin<ConfigProps> = (
  configOuter,
) => {
  const BACKGROUND_MODE_KEYS = ['remote-notification'];
  return withInfoPlist(configOuter, (config) => {
    if (!Array.isArray(config.modResults.UIBackgroundModes)) {
      config.modResults.UIBackgroundModes = [];
    }
    for (const key of BACKGROUND_MODE_KEYS) {
      if (!config.modResults.UIBackgroundModes.includes(key)) {
        config.modResults.UIBackgroundModes.push(key);
      }
    }

    return config;
  });
};
