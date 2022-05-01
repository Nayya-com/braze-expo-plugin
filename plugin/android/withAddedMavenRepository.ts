import { withProjectBuildGradle, ConfigPlugin } from '@expo/config-plugins';

export const withAddedMavenRepository: ConfigPlugin<ConfigProps> = (
  configOuter,
) => {
  const allProjectsRegex = /(allprojects\s*\{\s*\n?\s*repositories\s*\{)/;
  const additionalMavenRepositoryString =
    '        maven { url "https://appboy.github.io/appboy-android-sdk/sdk" }';

  return withProjectBuildGradle(configOuter, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      allProjectsRegex,
      `$1\n${additionalMavenRepositoryString}`,
    );
    return config;
  });
};
