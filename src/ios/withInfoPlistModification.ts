import { ConfigPlugin, withInfoPlist, InfoPlist } from '@expo/config-plugins';

const addBrazeData = (infoPlist: InfoPlist, iosSdkEndpoint: string) => ({
  ...infoPlist,
  Braze: {
    Endpoint: iosSdkEndpoint,
  },
});

export const withInfoPlistModification: ConfigPlugin<ConfigProps> = (
  configOuter,
  props,
) => {
  const { iosSdkEndpoint } = props;

  return withInfoPlist(configOuter, (config) => {
    config.modResults = addBrazeData(config.modResults, iosSdkEndpoint);
    return config;
  });
};
