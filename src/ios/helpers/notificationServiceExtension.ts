import fs from 'fs';

import { generateAppGroup } from './appGroups';

export const NSE_NAME = 'BrazeNotificationServiceExtension';

export const updateNseInfoPlist = ({
  bundleVersion,
  bundleShortVersion,
  infoPlistTargetFile,
}: {
  bundleVersion: string;
  bundleShortVersion: string;
  infoPlistTargetFile: string;
}) => {
  const BUNDLE_SHORT_VERSION_RE = /\{\{BUNDLE_SHORT_VERSION\}\}/;
  const BUNDLE_VERSION_RE = /\{\{BUNDLE_VERSION\}\}/;

  let plistFileString = fs.readFileSync(infoPlistTargetFile, 'utf-8');

  plistFileString = plistFileString.replace(BUNDLE_VERSION_RE, bundleVersion);
  plistFileString = plistFileString.replace(
    BUNDLE_SHORT_VERSION_RE,
    bundleShortVersion,
  );

  fs.writeFileSync(infoPlistTargetFile, plistFileString);
};

export const updateEntitlements = ({
  bundleIdentifier,
  entitlementsTargetFile,
}: {
  bundleIdentifier: string;
  entitlementsTargetFile: string;
}) => {
  const GROUP_IDENTIFIER_RE = /\{\{GROUP_IDENTIFIER\}\}/;

  let entitlementsFileString = fs.readFileSync(entitlementsTargetFile, 'utf-8');

  entitlementsFileString = entitlementsFileString.replace(
    GROUP_IDENTIFIER_RE,
    generateAppGroup(bundleIdentifier),
  );

  fs.writeFileSync(entitlementsTargetFile, entitlementsFileString);
};
