import {
  ConfigPlugin,
  AndroidConfig,
  AndroidManifest,
  withAndroidManifest,
} from '@expo/config-plugins';

const addPermissions = (androidManifest: AndroidManifest) => {
  AndroidConfig.Permissions.ensurePermissions(androidManifest, [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
  ]);

  return androidManifest;
};

export const withAddedPermissions: ConfigPlugin<ConfigProps> = (
  configOuter,
) => {
  return withAndroidManifest(configOuter, async (config) => {
    config.modResults = await addPermissions(config.modResults);
    return config;
  });
};
