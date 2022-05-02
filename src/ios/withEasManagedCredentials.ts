import { ConfigPlugin } from '@expo/config-plugins';

import { generateAppGroup } from './helpers/appGroups';
import { NSE_NAME } from './helpers/notificationServiceExtension';

export const withEasManagedCredentials: ConfigPlugin<ConfigProps> = (
  config,
) => {
  const bundleIdentifier = config?.ios?.bundleIdentifier;

  if (bundleIdentifier === undefined) {
    throw new Error(
      'Adding NotificationServiceExtension failed: ios.bundleIdentifier missing from app.config.js',
    );
  }
  config.extra = {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      build: {
        ...config.extra?.eas?.build,
        experimental: {
          ...config.extra?.eas?.build?.experimental,
          ios: {
            ...config.extra?.eas?.build?.experimental?.ios,
            appExtensions: [
              ...(config.extra?.eas?.build?.experimental?.ios?.appExtensions ??
                []),
              {
                targetName: NSE_NAME,
                bundleIdentifier: `${bundleIdentifier}.${NSE_NAME}`,
                entitlements: {
                  'com.apple.security.application-groups': [
                    generateAppGroup(bundleIdentifier),
                  ],
                },
              },
            ],
          },
        },
      },
    },
  };
  return config;
};
