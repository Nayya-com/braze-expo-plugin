import { ConfigPlugin, withMainApplication } from '@expo/config-plugins';

export const withMainApplicationModifications: ConfigPlugin = (configOuter) => {
  const importRegex = /^import [a-zA-Z.]+;/m;
  const addedImport = 'import com.appboy.AppboyLifecycleCallbackListener;';

  const onCreateRegex = /(void onCreate(.|\n)*super.onCreate\(.*\);)/;
  const addedCode =
    '    registerActivityLifecycleCallbacks(new AppboyLifecycleCallbackListener());';

  return withMainApplication(configOuter, (config) => {
    let stringContents: string = config.modResults.contents;
    const match = stringContents.match(importRegex);

    if (!match || match.index === undefined) {
      throw new Error('Unable to match "import" in MainApplication');
    }
    const indexOfFirstImport = match.index;

    stringContents = [
      stringContents.slice(0, indexOfFirstImport),
      addedImport,
      stringContents.slice(indexOfFirstImport),
    ].join('\n');

    stringContents = stringContents.replace(onCreateRegex, `$1\n${addedCode}`);

    config.modResults.contents = stringContents;

    return config;
  });
};
