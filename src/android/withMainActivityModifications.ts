import { ConfigPlugin, withMainActivity } from '@expo/config-plugins';

import { getLaunchMode } from './helpers/launchMode';

const onNewIntentRegexExistsRegex = /void onNewIntent/;
const onNewIntentRegex =
  /(void onNewIntent\(Intent\s+([a-zA-Z]+)\s*\)(.|\n)*super.onNewIntent\(.*\);\s*\n)/;
const endOfClassRegex = /(}\s+)$/;

const addToOrCreateNewIntent = (stringContents: string): string => {
  const match = stringContents.match(onNewIntentRegexExistsRegex);

  if (!match || match.index === undefined) {
    return createNewIntentMethod(stringContents);
  }

  return updateNewIntentMethod(stringContents);
};

const updateNewIntentMethod = (stringContents: string): string => {
  const match = stringContents.match(onNewIntentRegex);

  if (!match || match.index === undefined) {
    throw new Error(
      'Unable to add to existing "void onNewIntent" in MainActivity',
    );
  }

  const fullMatch = match[1];
  const intentVariableName = match[2];
  const indexOfMatch = match.index;
  const indexAfterMatch = indexOfMatch + fullMatch.length;

  const addedLine = `    setIntent(${intentVariableName});`;

  return [
    stringContents.slice(0, indexAfterMatch),
    addedLine,
    stringContents.slice(indexAfterMatch),
  ].join('\n');
};

const createNewIntentMethod = (stringContents: string): string => {
  const match = stringContents.match(endOfClassRegex);

  if (!match || match.index === undefined) {
    throw new Error('Unable to add new "void onNewIntent" to MainActivity');
  }

  return [
    stringContents.slice(0, match.index),
    '  @Override',
    '  public void onNewIntent(Intent intent) {',
    '      super.onNewIntent(intent);',
    '      setIntent(intent);',
    '  }',
    match[1],
  ].join('\n');
};

export const withMainActivityModifications: ConfigPlugin = (configOuter) => {
  return withMainActivity(configOuter, async (config) => {
    const launchMode = await getLaunchMode(config);

    if (launchMode === 'singleTask') {
      let stringContents = config.modResults.contents;

      stringContents = addToOrCreateNewIntent(stringContents);

      config.modResults.contents = stringContents;
    }

    return config;
  });
};
