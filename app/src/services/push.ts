/**
 * push.ts — System push notification registration & handling
 *
 * Wraps @react-native-firebase/messaging (FCM, relays to APNs on iOS)
 * + @notifee/react-native (foreground display + tap handling, since
 * FCM does not auto-display a notification while the app is foregrounded).
 */
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { userApi } from './api';
import { navigationRef } from '../navigation/navigationRef';

const ANDROID_CHANNEL_ID = 'default';
/** Set once we've shown the OS permission prompt, so we never nag again. */
const PUSH_PROMPT_KEY = '@push_permission_prompted';

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: ANDROID_CHANNEL_ID,
    name: 'General',
    importance: AndroidImportance.HIGH,
  });
};

/** Prompts the OS permission dialog (iOS) / POST_NOTIFICATIONS (Android 13+). */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }

  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
};

/** Reads current permission status without prompting. */
export const hasNotificationPermission = async (): Promise<boolean> => {
  const authStatus = await messaging().hasPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
};

/** Gets the current FCM token and sends it to the backend for the logged-in user. */
export const registerPushToken = async (): Promise<void> => {
  try {
    const granted = await hasNotificationPermission();
    if (!granted) return;

    await ensureAndroidChannel();

    if (Platform.OS === 'ios' && !messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }

    const token = await messaging().getToken();
    await userApi.registerPushToken(token, Platform.OS as 'ios' | 'android');
  } catch (error) {
    console.error('[push] Failed to register push token:', error);
  }
};

/**
 * Asks for notification permission at most once per install, then registers the
 * push token. Call this from the dashboard — NOT during signup, where an OS
 * dialog interrupts the flow and pauses the Activity mid screen-transition.
 */
export const ensurePushRegistration = async (): Promise<void> => {
  try {
    // Already granted — nothing to prompt, just refresh the token.
    if (await hasNotificationPermission()) {
      await registerPushToken();
      return;
    }

    // Only ever prompt once; re-prompting on every dashboard visit is nagging.
    if (await AsyncStorage.getItem(PUSH_PROMPT_KEY)) return;
    await AsyncStorage.setItem(PUSH_PROMPT_KEY, 'true');

    const granted = await requestNotificationPermission();
    if (granted) await registerPushToken();
  } catch (error) {
    // Permission/registration failures are non-fatal — never block the UI.
    console.error('[push] ensurePushRegistration failed:', error);
  }
};

/** Removes this device's token from the backend — call on logout. */
export const unregisterPushToken = async (): Promise<void> => {
  try {
    if (Platform.OS === 'ios' && !messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }

    const token = await messaging().getToken();
    await userApi.removePushToken(token);
  } catch (error) {
    console.error('[push] Failed to remove push token:', error);
  }
};

/** Mirrors the type→screen mapping already used in NotificationsScreen. */
const navigateFromNotificationData = (data?: Record<string, string>) => {
  if (!data?.type || !navigationRef.isReady()) return;

  // The app's navigators are untyped (screen props use `any` throughout),
  // so this cast matches the rest of the codebase rather than fighting it.
  const navigate = navigationRef.navigate as any;

  switch (data.type) {
    case 'request_sent':
    case 'request_accepted':
    case 'new_message':
      navigate('MainTabs', { screen: 'Messages' });
      break;
    case 'new_reply':
    case 'new_post_nearby':
      if (data.referenceId) navigate('PostDetail', { postId: data.referenceId });
      break;
    case 'new_user_nearby':
      if (data.referenceId) navigate('UserProfile', { userId: data.referenceId });
      break;
    default:
      navigate('Notifications');
  }
};

/** Call once near app startup (e.g. in App.tsx). Returns an unsubscribe function. */
export const initPushListeners = () => {
  ensureAndroidChannel();

  // Foreground messages don't auto-display on either platform — show via Notifee.
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    await notifee.displayNotification({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      data: remoteMessage.data,
      android: { channelId: ANDROID_CHANNEL_ID, pressAction: { id: 'default' } },
    });
  });

  // Token rotated by the OS/FCM — re-register with the backend.
  const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
    try {
      await userApi.registerPushToken(token, Platform.OS as 'ios' | 'android');
    } catch (error) {
      console.error('[push] Failed to re-register refreshed token:', error);
    }
  });

  // Tapped a Notifee-displayed (foreground) notification.
  const unsubscribeNotifeeEvents = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      navigateFromNotificationData(detail.notification?.data as Record<string, string> | undefined);
    }
  });

  // Tapped a system tray notification that opened the app from the background.
  const unsubscribeOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
    navigateFromNotificationData(remoteMessage.data as Record<string, string> | undefined);
  });

  // App was launched by tapping a notification while fully killed.
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        navigateFromNotificationData(remoteMessage.data as Record<string, string> | undefined);
      }
    });

  return () => {
    unsubscribeForeground();
    unsubscribeTokenRefresh();
    unsubscribeNotifeeEvents();
    unsubscribeOpenedApp();
  };
};

/** Must be called at the top level of index.js, before AppRegistry.registerComponent. */
export const registerBackgroundHandler = () => {
  messaging().setBackgroundMessageHandler(async () => {
    // No-op: FCM already displays the system tray notification itself for
    // notification+data messages while the app is backgrounded/killed.
  });
};
