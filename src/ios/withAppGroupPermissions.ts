import { ConfigPlugin, withEntitlementsPlist } from '@expo/config-plugins';

import { generateAppGroup } from './helpers/appGroups';

/**
 * Add "App Group" permission
 * @see https://documentation.onesignal.com/docs/react-native-sdk-setup#step-4-install-for-ios-using-cocoapods-for-ios-apps (step 4.4)
 */
export const withAppGroupPermissions: ConfigPlugin<ConfigProps> = (
  configOuter,
) => {
  const APP_GROUP_KEY = 'com.apple.security.application-groups';
  return withEntitlementsPlist(configOuter, (config) => {
    if (!Array.isArray(config.modResults[APP_GROUP_KEY])) {
      config.modResults[APP_GROUP_KEY] = [];
    }

    const bundleIdentifier = config?.ios?.bundleIdentifier;

    if (bundleIdentifier === undefined) {
      throw new Error(
        'Adding NotificationServiceExtension failed: ios.bundleIdentifier missing from app.config.js',
      );
    }

    const modResultsArray = config.modResults[APP_GROUP_KEY] as any[];
    const entitlement = generateAppGroup(bundleIdentifier);

    if (!modResultsArray.includes(entitlement)) {
      modResultsArray.push(entitlement);
    }

    return config;
  });
};
