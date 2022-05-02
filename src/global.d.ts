declare type ConfigProps = {
  androidSdkApiKey: string;
  androidSdkEndpoint: string;
  iosSdkApiKey: string;
  iosSdkEndpoint: string;
  firebaseCloudMessagingSenderId: string;
  firebaseBoMVersion: string;
  smallNotificationIcon?: string;
  largeNotificationIcon?: string;
  notificationIconBackgroundColor?: string;
};

type OptionalKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? never : K;
}[keyof T];

type RequiredProps = Exclude<OptionalKeys<ConfigProps>, undefined>;
