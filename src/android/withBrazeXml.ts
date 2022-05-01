import {
  ConfigPlugin,
  AndroidConfig,
  BaseMods,
  Mod,
  withMod,
} from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import fs from 'fs';

import {
  generateNotificationIconImageFiles,
  notificationIconResource,
} from '../helpers/notificationIcon';

// // TODO: store the image files and return the asset path
const generateFilesAndReturnResource = async (
  iconPath: string | undefined,
  projectRoot: string,
  suffix: string,
) => {
  if (!iconPath) return undefined;

  await generateNotificationIconImageFiles(iconPath, projectRoot, suffix);

  return notificationIconResource(suffix);
};

const generateBrazeXmlContents = async (
  {
    androidSdkApiKey,
    androidSdkEndpoint,
    firebaseCloudMessagingSenderId,
    smallNotificationIcon,
    largeNotificationIcon,
    iconBackgroundColor,
  }: ConfigProps,
  projectRoot: string,
) => {
  const smallIconResource = await generateFilesAndReturnResource(
    smallNotificationIcon,
    projectRoot,
    'small',
  );

  const largeIconResource = await generateFilesAndReturnResource(
    largeNotificationIcon,
    projectRoot,
    'large',
  );

  return `
<?xml version="1.0" encoding="utf-8"?>
<resources>
<string name="com_braze_api_key">${androidSdkApiKey}</string>
<string translatable="false" name="com_braze_custom_endpoint">${androidSdkEndpoint}</string>
<bool translatable="false" name="com_braze_firebase_cloud_messaging_registration_enabled">true</bool>
<string translatable="false" name="com_braze_firebase_cloud_messaging_sender_id">${firebaseCloudMessagingSenderId}</string>
<bool name="com_braze_handle_push_deep_links_automatically">true</bool>
${
  smallIconResource
    ? `<drawable name="com_braze_push_small_notification_icon">${smallIconResource}</drawable>`
    : ''
}
${
  largeIconResource
    ? `<drawable name="com_braze_push_large_notification_icon">${largeIconResource}</drawable>`
    : ''
}
${
  iconBackgroundColor
    ? `<integer name="com_braze_default_notification_accent_color">${iconBackgroundColor}</integer>`
    : ''
}
</resources>
`.trim();
};

/**
 * A plugin which adds res/values/braze.xml
 */
export const withBrazeXmlBaseMod: ConfigPlugin<ConfigProps> = (
  config,
  props,
) => {
  return BaseMods.withGeneratedBaseMods(config, {
    platform: 'android',
    providers: {
      // Append a custom rule to supply AppDelegate header data to mods on `mods.android.brazeXml`
      brazeXml: BaseMods.provider({
        // Get the local filepath for res/values/braze.xml
        async getFilePath({ modRequest: { projectRoot } }) {
          const resourceFolder =
            await AndroidConfig.Paths.getResourceFolderAsync(projectRoot);
          return `${resourceFolder}/values/braze.xml`;
        },

        // This 'read' method is required, but we skip this since we don't expect the file to exist
        async read() {
          return '';
        },

        // Write braze.xml to the filesystem.
        async write(filePath: string, { modRequest: { projectRoot } }) {
          const brazeXmlContents = await generateBrazeXmlContents(
            props,
            projectRoot,
          );

          await fs.promises.writeFile(filePath, brazeXmlContents);
        },
      }),
    },
  });
};

/**
 * (Utility) Provides the Braze XML file
 */
const withBrazeXmlMod = (config: ExpoConfig, action: Mod<unknown>) => {
  return withMod(config, {
    platform: 'android',
    mod: 'brazeXml',
    action,
  });
};

/*
 * Wrapper
 */
export const withBrazeXml: ConfigPlugin = (configOuter) =>
  withBrazeXmlMod(configOuter, (action) => action);
