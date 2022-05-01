import {
  ConfigPlugin,
  withMainApplication,
  ExportedConfigWithProps,
} from '@expo/config-plugins';

export const withMainApplicationModifications: ConfigPlugin = (configOuter) => {
  const importRegex = /^import [a-zA-Z.]+;/m;
  const addedImport = 'import com.appboy.AppboyLifecycleCallbackListener;';

  const onCreateRegex = /(void onCreate(.|\n)*super.onCreate\(.*\);)/;
  const addedCode =
    '    registerActivityLifecycleCallbacks(new AppboyLifecycleCallbackListener());';

  return withMainApplication(configOuter, (config: ExportedConfigWithProps) => {
    let stringContents = config.modResults.contents;
    const indexOfFirstImport = stringContents.match(importRegex).index;

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
