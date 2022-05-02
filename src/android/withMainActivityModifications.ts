import { ConfigPlugin, withMainActivity } from '@expo/config-plugins';

import { getLaunchMode } from './helpers/launchMode';

const addImport = (stringContents: string): string => {
  const importRegex = /^import [a-zA-Z.]+;/m;
  const addedImport =
    'import com.braze.BrazeActivityLifecycleCallbackListener;';

  const match = stringContents.match(importRegex);
  if (!match || match.index === undefined) {
    throw new Error('Unable to match "import" in MainActivity');
  }
  const indexOfFirstImport = match.index;

  stringContents = [
    stringContents.slice(0, indexOfFirstImport),
    addedImport,
    stringContents.slice(indexOfFirstImport),
  ].join('\n');

  return stringContents;
};

const addToOnCreate = (stringContents: string): string => {
  const onCreateRegex =
    /(void onCreate\(.*\)(.|\n)*super.onCreate\(.*\);\s*\n)/;

  const match = stringContents.match(onCreateRegex);
  if (!match || match.index === undefined) {
    throw new Error('Unable to match "void onCreate" in MainActivity');
  }

  const fullMatch = match[1];
  const indexOfMatch = match.index;
  const indexAfterMatch = indexOfMatch + fullMatch.length;

  const addedLine =
    '    registerActivityLifecycleCallbacks(new BrazeActivityLifecycleCallbackListener());';

  stringContents = [
    stringContents.slice(0, indexAfterMatch),
    addedLine,
    stringContents.slice(indexAfterMatch),
  ].join('\n');

  return stringContents;
};

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

      stringContents = addImport(stringContents);
      stringContents = addToOnCreate(stringContents);
      stringContents = addToOnNewIntent(stringContents);

      config.modResults.contents = stringContents;
    }

    return config;
  });
};
