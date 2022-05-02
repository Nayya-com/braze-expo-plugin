import { ConfigPlugin } from '@expo/config-plugins';

import { withAddedFirebaseMessagingDependency } from './android/withAddedFirebaseMessagingDependency';
import { withAddedMavenRepository } from './android/withAddedMavenRepository';
import { withAddedMessagingService } from './android/withAddedMessagingService';
import { withAddedPermissions } from './android/withAddedPermissions';
import { withBrazeXmlBaseMod, withBrazeXml } from './android/withBrazeXml';
import { withMainActivityModifications } from './android/withMainActivityModifications';
import { withMainApplicationModifications } from './android/withMainApplicationModifications';
import { guardProps, guardConfig } from './helpers/guards';
import { withAppDelegateModifications } from './ios/withAppDelegateModifications';
import { withAppGroupPermissions } from './ios/withAppGroupPermissions';
import { withApsEnvironment } from './ios/withApsEnvironment';
import { withEasManagedCredentials } from './ios/withEasManagedCredentials';
import { withInfoPlistModification } from './ios/withInfoPlistModification';
import { withNotificationServiceExtension } from './ios/withNotificationServiceExtension';
import { withRemoteNotificationsPermissions } from './ios/withRemoteNotificationsPermissions';

const modifyConfig: ConfigPlugin<ConfigProps> = (config, propsProvided) => {
  guardConfig(config);
  const props = guardProps(propsProvided);

  const fns = [
    withAddedFirebaseMessagingDependency,
    withAddedMavenRepository,
    withAddedMessagingService,
    withAddedPermissions,
    withAppDelegateModifications,
    withAppGroupPermissions,
    withApsEnvironment,
    withBrazeXml,
    withEasManagedCredentials,
    withInfoPlistModification,
    withMainActivityModifications,
    withMainApplicationModifications,
    withNotificationServiceExtension,
    withRemoteNotificationsPermissions,

    // Base mods MUST be last (see https://docs.expo.dev/guides/config-plugins/)
    withBrazeXmlBaseMod,
  ] as ConfigPlugin<ConfigProps>[]; // Type coercion so that TypeScript doesn't complain about the extra `props` param some some values of `fn` below

  // Apply all of the functions to config, in order:
  return fns.reduce((acc, fn) => fn(acc, props), config);
};

export default modifyConfig;
