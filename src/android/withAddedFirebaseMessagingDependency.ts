import { withAppBuildGradle, ConfigPlugin } from '@expo/config-plugins';

const addIndent = (line: string) => `    ${line}`;

export const withAddedFirebaseMessagingDependency: ConfigPlugin<ConfigProps> = (
  configOuter,
  props,
) => {
  const { firebaseBoMVersion } = props;

  const firebaseBoMMajorVersion = parseInt(
    firebaseBoMVersion.split('.')[0],
    10,
  );

  const firebaseMessagingString = [
    // Import the Firebase BoM
    `implementation platform("com.google.firebase:firebase-bom:${firebaseBoMVersion}")`,

    // Declare the dependency for the Firebase SDK for Google Analytics
    'implementation "com.google.firebase:firebase-analytics"',

    // Add Firebase Messaging SDK
    'implementation "com.google.firebase:firebase-messaging"',

    // NOTE: this is obselete when using Firebase BoM v28+
    firebaseBoMMajorVersion < 28
      ? 'implementation "com.google.firebase:firebase-core"'
      : '',
  ]
    .filter((a) => a.length > 0)
    .map(addIndent)
    .join('\n');

  return withAppBuildGradle(configOuter, (config) => {
    const dependenciesBlockRegex = /(dependencies\s*\{[^\S\r\n]*)/;

    config.modResults.contents = config.modResults.contents.replace(
      dependenciesBlockRegex,
      `$1\n${firebaseMessagingString}\n`,
    );

    return config;
  });
};
