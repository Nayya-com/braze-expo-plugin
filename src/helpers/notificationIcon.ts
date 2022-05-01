// NOTE: this code is mostly taken from expo-notifications

import { generateImageAsync } from '@expo/image-utils';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

type DPIString = 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi';
type dpiMap = Record<DPIString, { folderName: string; scale: number }>;

export const ANDROID_RES_PATH = 'android/app/src/main/res/';
export const dpiValues: dpiMap = {
  mdpi: { folderName: 'mipmap-mdpi', scale: 1 },
  hdpi: { folderName: 'mipmap-hdpi', scale: 1.5 },
  xhdpi: { folderName: 'mipmap-xhdpi', scale: 2 },
  xxhdpi: { folderName: 'mipmap-xxhdpi', scale: 3 },
  xxxhdpi: { folderName: 'mipmap-xxxhdpi', scale: 4 },
};

const BASELINE_PIXEL_SIZE = 24;
const ERROR_MSG_PREFIX =
  'An error occurred while configuring Android notifications. ';

const addSuffix = (str: string, suffix: string) => `${str}_${suffix}`;

const NOTIFICATION_ICON_FILENAME_BASE = 'notification_icon';

const notificationIcon = (suffix: string) =>
  addSuffix(NOTIFICATION_ICON_FILENAME_BASE, suffix);

export const notificationIconResource = (suffix: string) =>
  `@drawable/${notificationIcon(suffix)}`;

export const generateNotificationIconImageFiles = async (
  iconPath: string,
  projectRoot: string,
  suffix: string,
): Promise<void[]> =>
  Promise.all(
    Object.values(dpiValues).map(async ({ folderName, scale }) => {
      const drawableFolderName = folderName.replace('mipmap', 'drawable');
      const dpiFolderPath = resolve(
        projectRoot,
        ANDROID_RES_PATH,
        drawableFolderName,
      );
      if (!existsSync(dpiFolderPath)) {
        mkdirSync(dpiFolderPath, { recursive: true });
      }
      const iconSizePx = BASELINE_PIXEL_SIZE * scale;

      try {
        const resizedIcon = (
          await generateImageAsync(
            { projectRoot, cacheType: 'android-notification' },
            {
              src: iconPath,
              width: iconSizePx,
              height: iconSizePx,
              resizeMode: 'cover',
              backgroundColor: 'transparent',
            },
          )
        ).source;

        const fullPath = resolve(
          dpiFolderPath,
          notificationIcon(suffix) + '.png',
        );
        writeFileSync(fullPath, resizedIcon);
      } catch (e) {
        throw new Error(
          ERROR_MSG_PREFIX +
            'Encountered an issue resizing Android notification icon: ' +
            e,
        );
      }
    }),
  );
