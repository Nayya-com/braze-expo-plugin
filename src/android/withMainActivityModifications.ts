import { ConfigPlugin, withMainActivity } from '@expo/config-plugins';

import { getLaunchMode } from './helpers/launchMode';

const addToOnNewIntent = (stringContents: string): string => {
  const onNewIntentRegex =
    /(void onNewIntent\(Intent\s+([a-zA-Z]+)\s*\)(.|\n)*super.onNewIntent\(.*\);\s*\n)/;

  const match = stringContents.match(onNewIntentRegex);
  if (!match || match.index === undefined) {
    throw new Error('Unable to match "void onNewIntent" in MainActivity');
  }
  const fullMatch = match[1];
  const intentVariableName = match[2];
  const indexOfMatch = match.index;
  const indexAfterMatch = indexOfMatch + fullMatch.length;

  const addedLine = `    setIntent(${intentVariableName});`;

  stringContents = [
    stringContents.slice(0, indexAfterMatch),
    addedLine,
    stringContents.slice(indexAfterMatch),
  ].join('\n');

  return stringContents;
};

export const withMainActivityModifications: ConfigPlugin = (configOuter) => {
  return withMainActivity(configOuter, async (config) => {
    const launchMode = await getLaunchMode(config);

    if (launchMode === 'singleTask') {
      let stringContents = config.modResults.contents;

      stringContents = addToOnNewIntent(stringContents);

      config.modResults.contents = stringContents;
    }

    return config;
  });
};
