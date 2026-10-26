import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const INTERVAL_SECONDS = 5;
// iOS keeps at most 64 pending local notifications, and repeating
// time-interval triggers must be >= 60s. So instead of one repeating
// trigger we queue a batch of one-shot notifications 5s apart.
const BATCH_SIZE = 60;
const CHANNEL_ID = "interval";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Interval reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function startIntervalNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const startedAt = Date.now();

  await Promise.all(
    Array.from({ length: BATCH_SIZE }, (_, i) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Local notification",
          body: `Notification #${i + 1} (every ${INTERVAL_SECONDS}s)`,
          data: { index: i + 1, startedAt },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: INTERVAL_SECONDS * (i + 1),
          channelId: CHANNEL_ID,
        },
      }),
    ),
  );
}

export async function stopIntervalNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getPendingCount(): Promise<number> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  return pending.length;
}
