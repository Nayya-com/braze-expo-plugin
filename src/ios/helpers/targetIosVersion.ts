import fs from 'fs';
import path from 'path';

const PLATFORM_REGEX = /platform :ios,\s+'(?<version>.*)'/;

export const getTargetIosVersion = async (platformProjectRoot: string) => {
  const filePath = path.join(platformProjectRoot, 'Podfile');
  const podfile = fs.readFileSync(filePath, 'utf-8');

  const match = podfile.match(PLATFORM_REGEX);

  if (!match || !match.groups?.version) {
    throw new Error(
      'Unable to match "platform :ios, \'<version>\'" in Podfile',
    );
  }

  return match.groups.version;
};
