import {
  withAndroidManifest,
  AndroidManifest,
  ConfigPlugin,
  XML,
} from '@expo/config-plugins';

const serviceName = 'com.braze.push.BrazeFirebaseMessagingService';

const BrazeFirebaseMessagingServiceXml = `
<service android:name="${serviceName}"
  android:exported="false">
  <intent-filter>
    <action android:name="com.google.firebase.MESSAGING_EVENT" />
  </intent-filter>
</service>`;

const addService = async (androidManifest: AndroidManifest) => {
  const { manifest } = androidManifest;
  if (!Array.isArray(manifest.application)) {
    throw new Error(
      'withAddedMessagingService: No manifest.application array!',
    );
  }

  const application = manifest.application.find(
    (item) => item.$['android:name'] === '.MainApplication',
  );
  if (!application) {
    throw new Error('withAddedMessagingService: No .MainApplication!');
  }

  const services = Array.isArray(application.service)
    ? application.service
    : [];
  if (!services.find((item) => item.$['android:name'] === serviceName)) {
    const BrazeFirebaseMessagingService = await XML.parseXMLAsync(
      BrazeFirebaseMessagingServiceXml,
    );
    const { service } = BrazeFirebaseMessagingService;
    services.push(service as any);
  }
  application.service = services;

  return androidManifest;
};

export const withAddedMessagingService: ConfigPlugin<ConfigProps> = (
  configOuter,
) => {
  return withAndroidManifest(configOuter, async (config) => {
    config.modResults = await addService(config.modResults);
    return config;
  });
};
