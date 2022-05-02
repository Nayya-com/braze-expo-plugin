import { ConfigPlugin, withAppDelegate } from '@expo/config-plugins';

const importRegex = /^(#import .*)\n/m;
const addedImport = '#import "Appboy-iOS-SDK/AppboyKit.h"\n';

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
 */

// Register for push notifications (gets added to application:didFinishLaunchingWithOptions: delegate method)
// Also: set currentNotificationCenter.delegate = self, which allows Braze to handle incoming notifications.
const registerForPushNotificationsAndSetCenterDelegateBraze = `
  if (floor(NSFoundationVersionNumber) > NSFoundationVersionNumber_iOS_9_x_Max) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    center.delegate = self;
    UNAuthorizationOptions options = UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge;
    if (@available(iOS 12.0, *)) {
    options = options | UNAuthorizationOptionProvisional;
    }
    [center requestAuthorizationWithOptions:options
                          completionHandler:^(BOOL granted, NSError * _Nullable error) {
                            [[Appboy sharedInstance] pushAuthorizationFromUserNotificationCenter:granted];
    }];
    [[UIApplication sharedApplication] registerForRemoteNotifications];
  } else {
    UIUserNotificationSettings *settings = [UIUserNotificationSettings settingsForTypes:(UIUserNotificationTypeBadge | UIUserNotificationTypeAlert | UIUserNotificationTypeSound) categories:nil];
    [[UIApplication sharedApplication] registerForRemoteNotifications];
    [[UIApplication sharedApplication] registerUserNotificationSettings:settings];
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

export const withAppDelegateModifications: ConfigPlugin<ConfigProps> = (
  configOuter,
  props,
) => {
  const { iosSdkApiKey } = props;

  return withAppDelegate(configOuter, (config) => {
    let stringContents = config.modResults.contents;

    const match = stringContents.match(importRegex);
    if (!match || match.index === undefined) {
      throw new Error('Unable to match "#import" in AppDelegate.m');
    }
    const endOfMatchIndex = match.index + match[0].length;

    stringContents = [
      stringContents.slice(0, endOfMatchIndex),
      addedImport,
      stringContents.slice(endOfMatchIndex),
    ].join('');

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
