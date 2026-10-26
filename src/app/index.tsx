import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";

import {
  INTERVAL_SECONDS,
  ensurePermissions,
  getPendingCount,
  startIntervalNotifications,
  stopIntervalNotifications,
} from "@/lib/notifications";

export default function Index() {
  const [running, setRunning] = useState(false);
  const [received, setReceived] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      setReceived((n) => n + 1);
    });
    return () => sub.remove();
  }, []);

  // Top the queue back up whenever the app returns to the foreground.
  useEffect(() => {
    if (!running) return;
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active" && (await getPendingCount()) < 10) {
        await startIntervalNotifications();
      }
    });
    return () => sub.remove();
  }, [running]);

  const start = async () => {
    setError(null);
    if (!(await ensurePermissions())) {
      setError("Notification permission denied");
      return;
    }
    await startIntervalNotifications();
    setReceived(0);
    setRunning(true);
  };

  const stop = async () => {
    await stopIntervalNotifications();
    setRunning(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Local notification every {INTERVAL_SECONDS} seconds
      </Text>
      <Text>Status: {running ? "Running" : "Stopped"}</Text>
      <Text>Received while open: {received}</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, running && styles.stopButton]}
        onPress={running ? stop : start}
      >
        <Text style={styles.buttonText}>{running ? "Stop" : "Start"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  error: {
    color: "#d00",
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#208AEF",
  },
  stopButton: {
    backgroundColor: "#d33",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
