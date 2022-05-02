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
} from './helpers/notificationIcon';

const generateFilesAndReturnResource = async (
  iconPath: string | undefined,
  projectRoot: string,
  suffix: string,
) => {
  if (!iconPath) return undefined;

  await generateNotificationIconImageFiles(iconPath, projectRoot, suffix);

  return notificationIconResource(suffix);
};

const integerFromHexColor = (hexOrig: string) => {
  let hex = hexOrig;

  // Remove leading '#'
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }

  // If shorthand (like 'fff'), expand to 6-digit form
  if (hex.length === 3) {
    hex = [hex[0], hex[0], hex[1], hex[1], hex[2], hex[2]].join('');
  }

  // If missing the leading two alpha digits, add 'ff' for full opacity
  if (hex.length === 6) {
    hex = `ff${hex}`;
  }

  // Guard for invalid input
  if (hex.length !== 8) {
    throw new Error(
      `Invalid format for color. Should be in hex form like #fff, #aabbcc, or #aabbccdd. Instead got ${hexOrig}`,
    );
  }

  // Add leading hex prefix (Java)
  hex = `0x${hex}`;

  return hex;
};

const generateBrazeXmlContents = async (
  {
    androidSdkApiKey,
    androidSdkEndpoint,
    firebaseCloudMessagingSenderId,
    smallNotificationIcon,
    largeNotificationIcon,
    notificationIconBackgroundColor,
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

  const color =
    notificationIconBackgroundColor &&
    integerFromHexColor(notificationIconBackgroundColor);

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
  notificationIconBackgroundColor
    ? `<integer name="com_braze_default_notification_accent_color">${color}</integer>`
    : ''
}
</resources>
`.trim();
};

/**
 * A helper which adds the brazeXml mod
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
 * (Utility) Wraps the brazeXml base mod
 */
const withBrazeXmlMod = (config: ExpoConfig, action: Mod) => {
  return withMod(config, {
    platform: 'android',
    mod: 'brazeXml',
    action,
  });
};

/**
 * Mod to execute the brazeXml base mod
 */
export const withBrazeXml: ConfigPlugin = (configOuter) =>
  withBrazeXmlMod(configOuter, (config) => config);
