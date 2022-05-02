import { ConfigPlugin, withEntitlementsPlist } from '@expo/config-plugins';

/**
 * Add 'aps-environment' record with current environment to '<project-name>.entitlements' file
 * @see https://documentation.onesignal.com/docs/react-native-sdk-setup#step-4-install-for-ios-using-cocoapods-for-ios-apps
 */
export const withApsEnvironment: ConfigPlugin<ConfigProps> = (configOuter) => {
  const APS_MODE =
    process.env.EAS_BUILD_PROFILE === 'development'
      ? 'development'
      : 'production';

  return withEntitlementsPlist(configOuter, (config) => {
    config.modResults['aps-environment'] = APS_MODE;
    return config;
  });
};
