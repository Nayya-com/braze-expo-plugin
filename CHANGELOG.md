# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.9] - 2022-05-23
### Changed
- Made iOS Provisional Push optional:
  - No longer adding `UNAuthorizationOptionProvisional` to `UNAuthorizationOptions` by default.
  - There is now a `shouldUseProvisionalPush` option, which defaults to `false`.

## [0.1.8] - 2022-05-12
### Added
- Support for Expo SDK v45 by:
  - No longer pulling `iosDeploymentTarget` from `Podfile` on iOS. Instead this has been added as an optional prop that defaults to `12.0`.
  - Adding the `onNewIntent` method to `MainActivity` on Android if missing. This method was present with Expo SDK v44 but is no longer present with v45.

## [0.1.7] - 2022-05-06
### Added
- Adjusted MainApplication and MainActiviity changes to reflect latest Braze docs. This resolves an issue where the app would crash on launch in Android API v8.1.

## [0.1.6] - 2022-05-04
### Added
- Added feature: auto-clearing the app badge when app is opened on iOS.

## [0.1.5] - 2022-05-02
This is the first working version, tested on both Android and iOS.

It does not support all the native code required for some Braze SDK customizations, and it does not support:
- asking for permissions on iOS
- auto-clearing the app badge on iOS

It has not been tested on old versions of Android and iOS.

[0.1.8]: https://github.com/Nayya-com/braze-expo-plugin/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/Nayya-com/braze-expo-plugin/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/Nayya-com/braze-expo-plugin/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/Nayya-com/braze-expo-plugin/compare/cc6b7d18...v0.1.5