import {
  ConfigPlugin,
  ExportedConfigWithProps,
  AndroidConfig,
  withMainActivity,
} from '@expo/config-plugins';
import path from 'path';

const { getMainActivityOrThrow, readAndroidManifestAsync } =
  AndroidConfig.Manifest;

/*
 * NOTE: normally we'd use withAndroidManifest to read the manifest, but we
 * can't easily combine that with the withMainActivity call we're using below,
 * so we're manually reading the manifest instead.
 */
const getLaunchMode = async (config: ExportedConfigWithProps) => {
  const {
    modRequest: { platformProjectRoot },
  } = config;

  const filePath = path.join(
    platformProjectRoot,
    'app/src/main/AndroidManifest.xml',
  );
  const androidManifest = await readAndroidManifestAsync(filePath);
  const mainActivity = getMainActivityOrThrow(androidManifest);
  const launchMode = mainActivity.$['android:launchMode'];

  return launchMode;
};

export const withMainActivityModifications: ConfigPlugin = (configOuter) => {
  const onNewIntentRegex =
    /(void onNewIntent\(Intent\s+([a-zA-Z]+)\s*\)(.|\n)*super.onNewIntent\(.*\);\s*\n)/;

  return withMainActivity(configOuter, async (config) => {
    const launchMode = await getLaunchMode(config);

    if (launchMode === 'singleTask') {
      let stringContents = config.modResults.contents;

      const match = stringContents.match(onNewIntentRegex);
      if (!match || match.index === undefined) {
        throw new Error('Unable to match "void onNewIntent" in MainActivity');
      }
      const fullMatch = match[1];
      const intentVariableName = match[2];
      const indexOfMatch = match.index;
      const indexAfterMatch = indexOfMatch + fullMatch.length;

      stringContents = [
        stringContents.slice(0, indexAfterMatch),
        `    setIntent(${intentVariableName});`,
        stringContents.slice(indexAfterMatch),
      ].join('\n');

      config.modResults.contents = stringContents;
    }

    return config;
  });
};
