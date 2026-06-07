import { useState } from "react";
import * as SecureStore from "expo-secure-store";
import { ApiError, api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Screen, Subtitle } from "../../components/ui";

const TOKEN_KEY = "mygate_token";

export function ChangePasswordScreen() {
  const { token, refresh } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!token || !current || next.length < 6) {
      setError("Enter current password and new password (6+ chars)");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.changePassword(token, current, next);
      await SecureStore.setItemAsync(TOKEN_KEY, res.access_token);
      await refresh();
      setDone(true);
      setCurrent("");
      setNext("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Change password</Subtitle>
        <Field label="Current password" value={current} onChangeText={setCurrent} secureTextEntry />
        <Field label="New password" value={next} onChangeText={setNext} secureTextEntry />
        {error ? <ErrorText>{error}</ErrorText> : null}
        {done ? <Subtitle>Password updated successfully.</Subtitle> : null}
        <Button label="Update password" onPress={submit} loading={loading} />
      </Card>
    </Screen>
  );
}
