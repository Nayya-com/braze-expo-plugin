import { ExpoConfig } from '@expo/config-types';

const requiredPropsTypes: Record<RequiredProps, string> = {
  androidSdkApiKey: 'string',
  androidSdkEndpoint: 'string',
  iosSdkApiKey: 'string',
  iosSdkEndpoint: 'string',
  firebaseCloudMessagingSenderId: 'string',
  firebaseBoMVersion: 'string',
};

const requiredPropsDefaultValues: Pick<ConfigProps, RequiredProps> = {
  androidSdkApiKey: 'androidSdkApiKey_PLACEHOLDER',
  androidSdkEndpoint: 'androidSdkEndpoint_PLACEHOLDER',
  iosSdkApiKey: 'iosSdkApiKey_PLACEHOLDER',
  iosSdkEndpoint: 'iosSdkEndpoint_PLACEHOLDER',
  firebaseCloudMessagingSenderId: 'firebaseCloudMessagingSenderId_PLACEHOLDER',
  firebaseBoMVersion: '29.3.1',
};

export const guardProps = (props: Partial<ConfigProps>): ConfigProps =>
  Object.fromEntries(
    Object.entries(props).map(([propName, providedValue]) => {
      if (!(propName in requiredPropsTypes)) return [propName, providedValue];
      const name = propName as RequiredProps; // Since propName is a required prop, we can cast the type.

      let value = providedValue;

      if (value === undefined) {
        if (process.env.EAS_BUILD) {
          // When running an EAS build, throw if any vars are missing:
          throw new Error(
            `Missing prop -- ${name} must be provided in app.config.js!`,
          );
        } else {
          // If not an EAS build (e.g. `expo prebuild`), we can use default values
          value = requiredPropsDefaultValues[name];
        }
      }

      // Throw if any vars have incorrect type:
      const propType = requiredPropsTypes[name];
      if (typeof value !== propType) {
        throw new Error(
          `Incorrect type for prop -- ${name} should be a ${propType}`,
        );
      }

      return [name, value];
    }),
  ) as ConfigProps;

export const guardConfig = (config: ExpoConfig): void => {
  const { sdkVersion: expoSdkVersion } = config;

  if (!expoSdkVersion) {
    throw new Error(
      'Missing config -- please specify sdkVersion in your app.config.js (or app.json). It should line up with the version specified in your package.json.',
    );
  }
};
