# Expo config plugin for the Braze SDK

## Background

Currently, the Braze React Native SDK does not support the Expo managed workflow. This means that Braze customers who use the Expo managed workflow and want to include the Braze SDK are unable to do so unless they write their own Expo config plugin. This plugin meets our needs at Nayya, but may or may not meet the needs of other Braze SDK users.

Appboy/appboy-react-sdk#119 is tracking progress on a comprehensive config plugin.

### Disclaimer
This plugin may or may not meet the needs of your Expo app, and it should not be considered stable or production ready.

It is subject to breaking changes until we reach `v1.0.0`.

It has only been tested with:
 - Expo SDK versions 44 and 45
 - Using `eas build` with EAS managed credentials
 - A limited set of Android and iOS versions

## Installation
```
yarn add @nayya/braze-expo-plugin
```

## Setup
Add the plugin and its props to your `app.config.js`:
```javascript
// Required props:
const androidSdkApiKey = process.env.BRAZE_SDK_API_KEY_ANDROID;
const androidSdkEndpoint = process.env.BRAZE_SDK_ENDPOINT_ANDROID;
const iosSdkApiKey = process.env.BRAZE_SDK_API_KEY_IOS;
const iosSdkEndpoint = process.env.BRAZE_SDK_ENDPOINT_IOS;
const firebaseCloudMessagingSenderId = process.env.FIREBASE_SENDER_ID;
const firebaseBoMVersion = '29.3.1'; // Determines the versions of Firebase SDK packages. See https://firebase.google.com/docs/android/setup#available-libraries for versions.
const appleTeamId = '1234567890';

// Optional props:
const iosDeploymentTarget = '12.0'; // Defaults to '12.0'
const smallNotificationIcon = './assets/icons/notification-icon-small.png';
const largeNotificationIcon = './assets/icons/notification-icon-large.png';
const notificationIconBackgroundColor = '#6667AB';

export default {
  expo: {
    /* NOTE: the following config items are all required: */
    name: 'YourApp',
    sdkVersion: '44.0.0',
    ios: {
      buildNumber: '1.2.3',
      bundleIdentifier: 'your.app.here',
    },
    android: {
      versionCode: 123,
    },
    // ...
    plugins: [
      // ...
      [
        '@nayya/braze-expo-plugin',
        {
          androidSdkApiKey,
          androidSdkEndpoint,
          iosSdkApiKey,
          iosSdkEndpoint,
          firebaseCloudMessagingSenderId,
          firebaseBoMVersion,
          appleTeamId,
          smallNotificationIcon,
          largeNotificationIcon,
          notificationIconBackgroundColor,
          iosDeploymentTarget,
        }
      ],
    ],
  },
};
```

For local builds, define these vars in your local environment before building (could use `dotenv`).

For EAS builds, [add them as secrets on the Expo website](https://docs.expo.dev/build-reference/variables/#secrets-on-the-expo-website) and then run the `eas build` command.

## TODO
- Ingest `deploymentTarget` from `expo-build-properties` config plugin if it's in use.
- Add tests
  - Unit tests for helpers
  - Unit tests for all mods
- Add support for additional customization on Android:
  - [Back stack behavior](https://www.braze.com/docs/developer_guide/platform_integration_guides/android/push_notifications/android/integration/standard_integrationcustomizing-back-stack-behavior)
  - [Notification channels](https://www.braze.com/docs/developer_guide/platform_integration_guides/android/push_notifications/android/integration/standard_integrationstep-5-define-notification-channels)
  - [Custom notification display](https://www.braze.com/docs/developer_guide/platform_integration_guides/android/push_notifications/android/integration/standard_integrationcustom-displaying-notifications)
  - [Custom handling for push receipts, opens, dismissals, and key-value pairs](https://www.braze.com/docs/developer_guide/platform_integration_guides/androidush_notifications/android/integration/standard_integration/#custom-handling-for-push-receipts-opens-dismissals-and-key-value-pairs)
  - [HTML push notification support](https://www.braze.com/docs/developer_guide/platform_integration_guides/android/push_notifications/android/customization/html_rendered_push#html-push-notifications)
  - [Custom sounds](https://www.braze.com/docs/developer_guide/platform_integration_guides/android/push_notifications/android/customization/advanced_settings/#sounds)
  - [In-App Message Customization](https://www.braze.com/docs/developer_guide/platform_integration_guides/android/in-app_messaging/customization)
  - [Content Card Customization](https://www.braze.com/docs/developer_guide/platform_integration_guides/android/content_cards/customization)
- Add support for additional customization on iOS:
  - [Auto-clearing badge number](https://www.braze.com/docs/developer_guide/platform_integration_guides/ios/push_notifications/customization/badges)
  - [Custom sounds](https://www.braze.com/docs/developer_guide/platform_integration_guides/ios/push_notifications/customization/custom_sounds/)
  - [Ignoring internal push](https://www.braze.com/docs/developer_guide/platform_integration_guides/ios/push_notifications/customization/ignoring_internal_push/#checking-your-app-for-automatic-actions)
  - [Push primer integration](https://www.braze.com/docs/developer_guide/platform_integration_guides/ios/push_notifications/push_primer/)
  - [Push stories](https://www.braze.com/docs/developer_guide/platform_integration_guides/ios/push_notifications/push_story/#step-2-adding-the-notification-content-extension-target)
  - [Advanced implementation options](https://www.braze.com/docs/developer_guide/platform_integration_guides/ios/push_notifications/implementation_guide/)
  - [In-App Messaging Customization](https://www.braze.com/docs/developer_guide/platform_integration_guides/ios/in-app_messaging/customization)
  - [Content Card Customization](https://www.braze.com/docs/developer_guide/platform_integration_guides/ios/content_cards/customization)
