import fs from 'fs';

import { generateAppGroup } from './appGroups';

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
  const APS_ENVIRONMENT_MODE_RE = /\{\{APS_ENVIRONMENT_MODE\}\}/;
  const GROUP_IDENTIFIER_RE = /\{\{GROUP_IDENTIFIER\}\}/;

  const APS_MODE =
    process.env.EAS_BUILD_PROFILE === 'development'
      ? 'development'
      : 'production';

  let entitlementsFileString = fs.readFileSync(entitlementsTargetFile, 'utf-8');

  entitlementsFileString = entitlementsFileString.replace(
    APS_ENVIRONMENT_MODE_RE,
    APS_MODE,
  );
  entitlementsFileString = entitlementsFileString.replace(
    GROUP_IDENTIFIER_RE,
    generateAppGroup(bundleIdentifier),
  );

  fs.writeFileSync(entitlementsTargetFile, entitlementsFileString);
};
