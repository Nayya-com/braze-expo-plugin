import { ConfigPlugin, withMainApplication } from '@expo/config-plugins';

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

export const withMainApplicationModifications: ConfigPlugin = (configOuter) => {
  return withMainApplication(configOuter, (config) => {
    let stringContents: string = config.modResults.contents;

    stringContents = addImport(stringContents);
    stringContents = addToOnCreate(stringContents);

    config.modResults.contents = stringContents;

    return config;
  });
};
