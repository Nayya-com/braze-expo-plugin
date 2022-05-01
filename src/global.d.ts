declare type ConfigProps = {
  androidSdkApiKey: string;
  androidSdkEndpoint: string;
  iosSdkApiKey: string;
  iosSdkEndpoint: string;
  firebaseCloudMessagingSenderId: string;
  firebaseBoMVersion: string;
  smallNotificationIcon?: string;
  largeNotificationIcon?: string;
};

type RequiredProps = keyof Omit<
  ConfigProps,
  'smallNotificationIcon' | 'largeNotificationIcon'
>;
