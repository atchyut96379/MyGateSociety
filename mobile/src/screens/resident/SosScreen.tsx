import { useState } from "react";
import { ApiError, api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function SosScreen() {
  const { token } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      await api.raiseSos(token, message.trim() || undefined);
      setSent(true);
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send SOS");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Emergency SOS</Subtitle>
        <Muted>Alerts security at the gate immediately.</Muted>
        <Field
          label="Message (optional)"
          value={message}
          onChangeText={setMessage}
          placeholder="e.g. Need help at flat entrance"
        />
        {error ? <ErrorText>{error}</ErrorText> : null}
        {sent ? <Muted>SOS sent. Security has been notified.</Muted> : null}
        <Button label="Send SOS" variant="danger" onPress={send} loading={loading} />
      </Card>
    </Screen>
  );
}
