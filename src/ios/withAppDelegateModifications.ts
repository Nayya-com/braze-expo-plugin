import { ConfigPlugin, withAppDelegate } from '@expo/config-plugins';

const didFinishLaunchingMethodRegex =
  /(- \(BOOL\)application:\(UIApplication \*\)application didFinishLaunchingWithOptions:\(NSDictionary \*\)launchOptions(\s|\n)*?\{)/;

// Configure Braze SDK (gets added to application:didFinishLaunchingWithOptions: delegate method)
// From Braze docs: https://www.braze.com/docs/developer_guide/platform_integration_guides/react_native/react_sdk_setup/#step-22b-configure-the-braze-sdk
const configureBrazeSDKGenerator = ({
  iosSdkApiKey,
}: {
  iosSdkApiKey: string;
}) => `
  [Appboy startWithApiKey:@"${iosSdkApiKey}"
        inApplication:application
    withLaunchOptions:launchOptions];
`;

/**
 * Reference from Braze docs:
 *   - @see https://www.braze.com/docs/developer_guide/platform_integration_guides/ios/push_notifications/integration/#step-5-enable-push-handling
 *   - @see https://www.braze.com/docs/developer_guide/platform_integration_guides/ios/push_notifications/integration/#step-4-register-push-tokens-with-braze
 *   - @see https://www.braze.com/docs/developer_guide/platform_integration_guides/ios/push_notifications/integration/#using-usernotification-framework-ios-10
 *   - @see https://www.braze.com/docs/developer_guide/platform_integration_guides/ios/push_notifications/push_primer
 */

// Register for push notifications (gets added to application:didFinishLaunchingWithOptions: delegate method)
// Also: set currentNotificationCenter.delegate = self, which allows Braze to handle incoming notifications.
const registerForPushNotificationsAndSetCenterDelegateBraze = `
  if (@available(iOS 10.0, *)) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
      if (settings.authorizationStatus != UNAuthorizationStatusNotDetermined) {
        // authorization has already been requested, need to follow usual steps
        [center requestAuthorizationWithOptions:(UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge) completionHandler:^(BOOL granted, NSError * _Nullable error) {
          [[Appboy sharedInstance] pushAuthorizationFromUserNotificationCenter:granted];
        }];
        center.delegate = self;
        [center setNotificationCategories:[ABKPushUtils getAppboyUNNotificationCategorySet]];
        [[UIApplication sharedApplication] registerForRemoteNotifications];
      }
    }];
  } else {
    UIApplication *sharedApplication = [UIApplication sharedApplication];
    UIUserNotificationSettings *notificationSettings = [sharedApplication currentUserNotificationSettings];
    if (notificationSettings.types) {
      UIUserNotificationSettings *settings = [UIUserNotificationSettings settingsForTypes:(UIUserNotificationTypeBadge | UIUserNotificationTypeAlert | UIUserNotificationTypeSound) categories:[ABKPushUtils getAppboyUIUserNotificationCategorySet]];
      [sharedApplication registerUserNotificationSettings:settings];
      [sharedApplication registerForRemoteNotifications];
    }
  }
`;

// Enable push handling - notification received
const didReceiveRemoteNotificationBrazeHandler = `
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
  [[Appboy sharedInstance] registerApplication:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}`;

// Enable push handling - notification response
const didReceiveNotificationResponseBrazeHandler = `
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler {
  [[Appboy sharedInstance] userNotificationCenter:center didReceiveNotificationResponse:response withCompletionHandler:completionHandler];
}`;

// Foreground push handling
const willPresentNotificationBrazeHandler = `
- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler {
  if (@available(iOS 14.0, *)) {
    completionHandler(UNNotificationPresentationOptionList | UNNotificationPresentationOptionBanner);
  } else {
    completionHandler(UNNotificationPresentationOptionAlert);
  }
}`;

// Handle push token registration success
const didRegisterForRemoteNotificationsWithDeviceTokenBrazeHandler = `
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  [[Appboy sharedInstance] registerDeviceToken:deviceToken];
}`;

const brazeCodeSnippets = [
  didReceiveRemoteNotificationBrazeHandler,
  didReceiveNotificationResponseBrazeHandler,
  willPresentNotificationBrazeHandler,
  didRegisterForRemoteNotificationsWithDeviceTokenBrazeHandler,
];

const additionalMethodsForPushNotifications = `${brazeCodeSnippets.join(
  '\n',
)}\n`; // Join w/ newlines and ensure a newline at the end.

const addImport = (stringContents: string) => {
  const importRegex = /^(#import .*)\n/m;
  const addedImport = '#import "Appboy-iOS-SDK/AppboyKit.h"';

  const match = stringContents.match(importRegex);
  let endOfMatchIndex: number;
  if (!match || match.index === undefined) {
    // No imports found, just add to start of file:
    endOfMatchIndex = 0;
  } else {
    // Add after first import:
    endOfMatchIndex = match.index + match[0].length;
  }

  stringContents = [
    stringContents.slice(0, endOfMatchIndex),
    addedImport,
    stringContents.slice(endOfMatchIndex),
  ].join('\n');

  return stringContents;
};

const badgeClearingFullCode = `
- (void)applicationDidBecomeActive:(UIApplication *)application {
  [UIApplication sharedApplication].applicationIconBadgeNumber = 0;
}
`;

const addBadgeClearing = (stringContents: string) => {
  const methodRegex =
    /(-\s*\(\s*void\s*\)\s*applicationDidBecomeActive\s*:\s*\(\s*UIApplication\s*\*\s*\)\s*application\s*\{)/;
  const addedCode =
    '  [UIApplication sharedApplication].applicationIconBadgeNumber = 0;';

  const match = stringContents.match(methodRegex);

  // If method doesn't exist, add the method before didFinishLaunching:
  if (!match || match.index === undefined) {
    stringContents = stringContents.replace(
      didFinishLaunchingMethodRegex,
      `${badgeClearingFullCode}\n$1`,
    );
    return stringContents;
  }

  // Otherwise, add to the existing method:
  const endOfMatchIndex = match.index + match[0].length;

  stringContents = [
    stringContents.slice(0, endOfMatchIndex),
    addedCode,
    stringContents.slice(endOfMatchIndex),
  ].join('\n');

  return stringContents;
};

export const withAppDelegateModifications: ConfigPlugin<ConfigProps> = (
  configOuter,
  props,
) => {
  const { iosSdkApiKey } = props;

  return withAppDelegate(configOuter, (config) => {
    let stringContents = config.modResults.contents;

    stringContents = addImport(stringContents);
    stringContents = addBadgeClearing(stringContents);

    const configureBrazeSDK = configureBrazeSDKGenerator({ iosSdkApiKey });

    stringContents = stringContents.replace(
      didFinishLaunchingMethodRegex,
      [
        additionalMethodsForPushNotifications,
        '$1',
        configureBrazeSDK,
        registerForPushNotificationsAndSetCenterDelegateBraze,
      ].join(''),
    );

    config.modResults.contents = stringContents;
    return config;
  });
};
