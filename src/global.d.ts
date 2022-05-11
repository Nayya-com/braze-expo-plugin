declare type ConfigProps = {
  androidSdkApiKey: string;
  androidSdkEndpoint: string;
  iosSdkApiKey: string;
  iosSdkEndpoint: string;
  firebaseCloudMessagingSenderId: string;
  firebaseBoMVersion: string;
  appleTeamId: string;
  iosDeploymentTarget?: string;
  smallNotificationIcon?: string;
  largeNotificationIcon?: string;
  notificationIconBackgroundColor?: string;
};

type OptionalKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? never : K;
}[keyof T];

type RequiredProps = Exclude<OptionalKeys<ConfigProps>, undefined>;

declare module 'xcode' {
  interface xcode {
    project(projPath: string): any;
  }

  const xcode: xcode;
  export default xcode;
}
