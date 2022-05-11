import { ConfigPlugin, withMainActivity } from '@expo/config-plugins';

import { getLaunchMode } from './helpers/launchMode';

const ensureIntentImport = (stringContents: string): string => {
  const importString = `import android.content.Intent;`;

  if (!stringContents.includes(importString)) {
    // Add the import before the first existing import:
    stringContents = stringContents.replace(/(import)/, `${importString}\n$1`);
  }

  return stringContents;
};

const onNewIntentFullMethod = `
  @Override
  public void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
  }

`;

const mainActivityClassRegex = /(public\s+class\s+MainActivity.*\{\s*?\n)/;

const addOnNewIntent = (stringContents: string): string => {
  return stringContents.replace(
    mainActivityClassRegex,
    `$1${onNewIntentFullMethod}`,
  );
};

const addToExistingOnNewIntent = (
  stringContents: string,
  match: RegExpMatchArray,
): string => {
  const fullMatch = match[1];
  const intentVariableName = match[2];
  const indexOfMatch = match.index as number; // Type cast here since we've already checked this in addOnNewIntent below
  const indexAfterMatch = indexOfMatch + fullMatch.length;

  const addedLine = `    setIntent(${intentVariableName});`;

  stringContents = [
    stringContents.slice(0, indexAfterMatch),
    addedLine,
    stringContents.slice(indexAfterMatch),
  ].join('\n');

  return stringContents;
};

const addOrModifyOnNewIntent = (stringContents: string): string => {
  const onNewIntentRegex =
    /(void onNewIntent\(Intent\s+([a-zA-Z]+)\s*\)(.|\n)*super.onNewIntent\(.*\);\s*\n)/;

  const match = stringContents.match(onNewIntentRegex);
  if (!match || match.index === undefined) {
    // Method does not exist, so instead of adding to it, we'll need to add it in full:
    return addOnNewIntent(stringContents);
  }

  // Method *does* exist, so we'll just add to it:
  return addToExistingOnNewIntent(stringContents, match);
};

export const withMainActivityModifications: ConfigPlugin = (configOuter) => {
  return withMainActivity(configOuter, async (config) => {
    const launchMode = await getLaunchMode(config);

    if (launchMode === 'singleTask') {
      let stringContents = config.modResults.contents;

      stringContents = ensureIntentImport(stringContents);
      stringContents = addOrModifyOnNewIntent(stringContents);

      config.modResults.contents = stringContents;
    }

    return config;
  });
};
