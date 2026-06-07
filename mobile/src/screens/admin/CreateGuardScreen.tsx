import { useState } from "react";
import { Text } from "react-native";
import { ApiError, api } from "../../api/client";
import type { CreateUserResponse } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function AdminCreateGuardScreen() {
  const { token, user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreateUserResponse | null>(null);

  if (!user?.is_main_admin) {
    return (
      <Screen>
        <Card>
          <Muted>Only the main Secretary can create guard logins.</Muted>
        </Card>
      </Screen>
    );
  }

  async function submit() {
    if (!token || !name.trim() || !phone.trim()) {
      setError("Enter guard name and mobile");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.createUser(token, {
        name: name.trim(),
        phone: phone.trim(),
        role: "SECURITY",
      });
      setCreated(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create guard");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    const c = created.credentials;
    return (
      <Screen>
        <Card>
          <Subtitle>Guard created</Subtitle>
          <Text>Name: {c.name}</Text>
          <Text>Mobile: {c.phone}</Text>
          <Text>Password: {c.password}</Text>
          <Muted>Share these with the guard. They sign in with role Guard.</Muted>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Subtitle>New guard login</Subtitle>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Mobile" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Create guard" onPress={submit} loading={loading} />
      </Card>
    </Screen>
  );
}
