# Expo config plugin for the Braze SDK

## Background

Currently, the Braze React Native SDK does not support the Expo managed workflow. This means that Braze customers who use the Expo managed workflow and want to include the Braze SDK are unable to do so unless they write their own Expo config plugin. This plugin meets our needs at Nayya, but may or may not meet the needs of other Braze SDK users.

The [#119](https://github.com/Appboy/appboy-react-sdk/issues/119) issue in the Braze SDK repository is tracking their progress on a comprehensive config plugin.

## Installation
```
yarn add https://github.com/Nayya-com/braze-expo-plugin.git
```

TODO: add release branches.

## Setup
Add the plugin and its props to your `app.config.js`:
```javascript
// app.config.js
const androidSdkApiKey = process.env.BRAZE_SDK_API_KEY_ANDROID;
const androidSdkEndpoint = process.env.BRAZE_SDK_ENDPOINT_ANDROID;
const iosSdkApiKey = process.env.BRAZE_SDK_API_KEY_IOS;
const iosSdkEndpoint = process.env.BRAZE_SDK_ENDPOINT_IOS;
const firebaseCloudMessagingSenderId = process.env.FIREBASE_SENDER_ID;
const firebaseBoMVersion = '29.3.1'; // Determines the versions of Firebase SDK packages. See https://firebase.google.com/docs/android/setup#available-libraries for versions.

export default {
  expo: {
    sdkVersion: '44.0.0', // This is required, and should line up with the version specified in your package.json.
    // ...
    plugins: [
      // ...
      [
        'braze-expo-plugin',
        {
          androidSdkApiKey,
          androidSdkEndpoint,
          iosSdkApiKey,
          iosSdkEndpoint,
          firebaseCloudMessagingSenderId,
          firebaseBoMVersion,
        }
      ],
    ],
  },
};
```

For local builds, define these vars in your local environment before building (could use `dotenv`).

For EAS builds, [add them as secrets on the Expo website](https://docs.expo.dev/build-reference/variables/#secrets-on-the-expo-website) and then run the `eas build` command.