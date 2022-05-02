/**
 * Most of this code is based on the onesignal-expo-plugin config plugin
 * @see https://github.com/OneSignal/onesignal-expo-plugin
 */

import { ConfigPlugin, withXcodeProject } from '@expo/config-plugins';
import fs from 'fs';
import xcode from 'xcode';

import { name as thisPackageName } from '../../package.json';
import {
  updateNseInfoPlist,
  updateEntitlements,
  NSE_NAME,
} from './helpers/notificationServiceExtension';
import { getTargetIosVersion } from './helpers/targetIosVersion';

const PLIST_FILENAME = `${NSE_NAME}-Info.plist`;
const ENTITLEMENTS_FILENAME = `${NSE_NAME}.entitlements`;

const LOCAL_PATH_TO_NSE_FILES = `node_modules/${thisPackageName}/build/${NSE_NAME}`;

const TARGETED_DEVICE_FAMILY = `"1,2"`;

interface Options {
  appleTeamId: string;
  bundleIdentifier: string;
  bundleShortVersion: string;
  bundleVersion: string;
  platformProjectRoot: string;
  projectName: string;
}

const addNotificationServiceExtension = async (options: Options) => {
  const {
    appleTeamId,
    bundleIdentifier,
    bundleShortVersion,
    bundleVersion,
    platformProjectRoot,
    projectName,
  } = options;

  // not awaiting in order to not block main thread
  const iosTargetVersion = await getTargetIosVersion(platformProjectRoot);

  const projPath = `${platformProjectRoot}/${projectName}.xcodeproj/project.pbxproj`;

  const xcodeProject = xcode.project(projPath);

  xcodeProject.parse(async function (err: Error) {
    if (err) {
      throw new Error(`Error parsing iOS project: ${JSON.stringify(err)}`);
    }

    /* COPY OVER EXTENSION FILES */
    fs.mkdirSync(`${platformProjectRoot}/${NSE_NAME}`, { recursive: true });

    const files = [
      PLIST_FILENAME,
      ENTITLEMENTS_FILENAME,
      'NotificationService.h',
      'NotificationService.m',
    ];

    const getTargetFile = (filename: string) =>
      `${platformProjectRoot}/${NSE_NAME}/${filename}`;

    files.forEach((filename) => {
      const targetFile = getTargetFile(filename);
      fs.copyFileSync(`${LOCAL_PATH_TO_NSE_FILES}/${filename}`, targetFile);
    });

    /* MODIFY COPIED EXTENSION FILES */
    const infoPlistTargetFile = getTargetFile(PLIST_FILENAME);
    updateNseInfoPlist({
      bundleVersion,
      bundleShortVersion,
      infoPlistTargetFile,
    });

    updateEntitlements({
      bundleIdentifier,
      entitlementsTargetFile: getTargetFile(ENTITLEMENTS_FILENAME),
    });

    // Create new PBXGroup for the extension
    const extGroup = xcodeProject.addPbxGroup(files, NSE_NAME, NSE_NAME);

    // Add the new PBXGroup to the top level group. This makes the
    // files / folder appear in the file explorer in Xcode.
    const groups = xcodeProject.hash.project.objects['PBXGroup'];
    Object.keys(groups).forEach((key) => {
      if (groups[key].name === undefined) {
        xcodeProject.addToPbxGroup(extGroup.uuid, key);
      }
    });

    // WORK AROUND for codeProject.addTarget BUG
    // Xcode projects don't contain these if there is only one target
    // An upstream fix should be made to the code referenced in this link:
    //   - https://github.com/apache/cordova-node-xcode/blob/8b98cabc5978359db88dc9ff2d4c015cba40f150/lib/pbxProject.js#L860
    const projObjects = xcodeProject.hash.project.objects;
    projObjects['PBXTargetDependency'] =
      projObjects['PBXTargetDependency'] || {};
    projObjects['PBXContainerItemProxy'] =
      projObjects['PBXTargetDependency'] || {};

    if (xcodeProject.pbxTargetByName(NSE_NAME)) {
      console.warn(`${NSE_NAME} already exists in project. Skipping...`);
      return;
    }

    // Add the NSE target
    // This also adds PBXTargetDependency and PBXContainerItemProxy
    const nseTarget = xcodeProject.addTarget(
      NSE_NAME,
      'app_extension',
      NSE_NAME,
      `${bundleIdentifier}.${NSE_NAME}`,
    );

    // Add build phases to the new target
    xcodeProject.addBuildPhase(
      ['NotificationService.m'],
      'PBXSourcesBuildPhase',
      'Sources',
      nseTarget.uuid,
    );
    xcodeProject.addBuildPhase(
      [],
      'PBXResourcesBuildPhase',
      'Resources',
      nseTarget.uuid,
    );

    xcodeProject.addBuildPhase(
      [],
      'PBXFrameworksBuildPhase',
      'Frameworks',
      nseTarget.uuid,
    );

    // Edit the Deployment info of the target
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (
        typeof configurations[key].buildSettings !== 'undefined' &&
        configurations[key].buildSettings.PRODUCT_NAME === `"${NSE_NAME}"`
      ) {
        const buildSettingsObj = configurations[key].buildSettings;
        buildSettingsObj.DEVELOPMENT_TEAM = appleTeamId;
        buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET = iosTargetVersion;
        buildSettingsObj.TARGETED_DEVICE_FAMILY = TARGETED_DEVICE_FAMILY;
        buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `${NSE_NAME}/${ENTITLEMENTS_FILENAME}`;
        buildSettingsObj.CODE_SIGN_STYLE = 'Automatic';
      }
    }

    // Add development team to the target & the main
    xcodeProject.addTargetAttribute('DevelopmentTeam', appleTeamId, nseTarget);
    xcodeProject.addTargetAttribute('DevelopmentTeam', appleTeamId);

    fs.writeFileSync(projPath, xcodeProject.writeSync());
  });
};

export const withNotificationServiceExtension: ConfigPlugin<ConfigProps> = (
  configOuter,
  props,
) => {
  return withXcodeProject(configOuter, async (config) => {
    const { modRequest, ios, version: bundleShortVersion } = config;
    const { appleTeamId } = props;

    if (ios === undefined)
      throw new Error(
        'Adding NotificationServiceExtension failed: ios config missing from app.config.js.',
      );

    const { projectName, platformProjectRoot } = modRequest;
    const { bundleIdentifier, buildNumber: bundleVersion } = ios;

    if (bundleIdentifier === undefined) {
      throw new Error(
        'Adding NotificationServiceExtension failed: ios.bundleIdentifier missing from app.config.js',
      );
    }

    if (bundleShortVersion === undefined) {
      throw new Error(
        'Adding NotificationServiceExtension failed: version missing from app.config.js',
      );
    }

    if (bundleVersion === undefined) {
      throw new Error(
        'Adding NotificationServiceExtension failed: ios.buildNumber missing from app.config.js',
      );
    }

    if (projectName === undefined) {
      throw new Error(
        'Adding NotificationServiceExtension failed: name missing from app.config.js',
      );
    }

    const options = {
      appleTeamId,
      bundleIdentifier,
      bundleShortVersion,
      bundleVersion,
      platformProjectRoot,
      projectName,
    };

    await addNotificationServiceExtension(options);

    return config;
  });
};
