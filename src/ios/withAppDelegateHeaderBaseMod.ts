import {
  ConfigPlugin,
  IOSConfig,
  Mod,
  withMod,
  BaseMods,
} from '@expo/config-plugins';
import * as fs from 'fs';

/**
 * A plugin which adds new base modifiers to the prebuild config.
 */
export const withAppDelegateHeaderBaseMod: ConfigPlugin<ConfigProps> = (
  config,
) => {
  return BaseMods.withGeneratedBaseMods<'appDelegateHeader'>(config, {
    platform: 'ios',
    providers: {
      // Append a custom rule to supply AppDelegate header data to mods on `mods.ios.appDelegateHeader`
      appDelegateHeader:
        BaseMods.provider<IOSConfig.Paths.AppDelegateProjectFile>({
          // Get the local filepath that should be passed to the `read` method.
          getFilePath({ modRequest: { projectRoot } }) {
            const filePath =
              IOSConfig.Paths.getAppDelegateFilePath(projectRoot);

            // Replace the .m with a .h
            if (filePath.endsWith('.mm')) {
              const appDelegateHPath =
                filePath.substr(0, filePath.lastIndexOf('.')) + '.h';

              return appDelegateHPath;
            }
            // Possibly a Swift project...
            throw new Error(
              `Could not locate a valid AppDelegate.h at root: "${projectRoot}"`,
            );
          },
          // Read the input file from the filesystem.
          async read(filePath) {
            return IOSConfig.Paths.getFileInfo(filePath);
          },
          // Write the resulting output to the filesystem.
          async write(filePath: string, { modResults: { contents } }) {
            let stringContents = contents;

            stringContents = addImport(
              stringContents,
              '#import <UserNotifications/UNUserNotificationCenter.h>',
            );

            stringContents = modifyAppDelegateInterface(
              stringContents,
              /(@interface\s*AppDelegate\s*:\s*EXAppDelegateWrapper\s*\<)(.+)(\>)/gm,
              'RCTBridgeDelegate, UNUserNotificationCenterDelegate',
            );

            await fs.promises.writeFile(filePath, stringContents);
          },
        }),
    },
  });
};

/**
 * (Utility) Provides the AppDelegate header file for modification.
 */
export const withAppDelegateHeader: ConfigPlugin<
  Mod<IOSConfig.Paths.AppDelegateProjectFile>
> = (config, action) => {
  return withMod(config, {
    platform: 'ios',
    mod: 'appDelegateHeader',
    action,
  });
};

const modifyAppDelegateInterface = (
  stringContents: string,
  regex: RegExp,
  codeToModify?: string,
) => {
  const match = stringContents.match(regex);

  let endOfMatchIndex: number;
  if (!match || match.index === undefined) {
    // No imports found, just add to start of file:
    endOfMatchIndex = 0;
  } else {
    // Add after first import:
    endOfMatchIndex = match.index + match[0].length;
  }

  stringContents = stringContents.replace(regex, `$1${codeToModify}$3`);

  return stringContents;
};

const addImport = (stringContents: string, importToAdd: string) => {
  let endOfMatchIndex = 0;

  stringContents = [
    stringContents.slice(0, endOfMatchIndex),
    importToAdd,
    stringContents.slice(endOfMatchIndex),
  ].join('\n');

  return stringContents;
};

// (Example) Log the contents of the modifier.
export const withSimpleAppDelegateHeaderMod: ConfigPlugin<ConfigProps> = (
  config,
) => {
  return withAppDelegateHeader(config, (config) => {
    return config;
  });
};
