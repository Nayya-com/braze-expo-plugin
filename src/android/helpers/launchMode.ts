import { ExportedConfigWithProps, AndroidConfig } from '@expo/config-plugins';
import path from 'path';

const { getMainActivityOrThrow, readAndroidManifestAsync } =
  AndroidConfig.Manifest;

export const getLaunchMode = async (config: ExportedConfigWithProps) => {
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
