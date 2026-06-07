import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ApiError, api } from "../api/client";
import type { Role } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen } from "../components/ui";
import { API_BASE, SOCIETY_NAME } from "../config";
import { colors } from "../theme";

const ROLES: { value: Role; label: string }[] = [
  { value: "RESIDENT", label: "Resident" },
  { value: "SECURITY", label: "Guard" },
  { value: "ADMIN", label: "Secretary" },
  { value: "COMMITTEE", label: "Committee" },
];

export function LoginScreen() {
  const { login } = useAuth();
  const [bootstrapMode, setBootstrapMode] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("RESIDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .loginConfig()
      .then((cfg) => {
        setBootstrapMode(cfg.bootstrap_mode);
        if (cfg.bootstrap_mode) {
          setPhone(cfg.bootstrap_login_id);
          setRole("ADMIN");
        }
      })
      .catch(() => setError("Cannot reach API. Check internet or API URL."))
      .finally(() => setConfigLoading(false));
  }, []);

  async function onSubmit() {
    if (!phone.trim() || !password) {
      setError("Enter mobile number and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(phone.trim(), password, bootstrapMode ? "ADMIN" : role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.brand}>{SOCIETY_NAME}</Text>
      <Muted>Android app · connected to {API_BASE}</Muted>

      {configLoading ? (
        <Muted>Checking setup…</Muted>
      ) : (
        <Card>
          {bootstrapMode && (
            <Muted>First-time Secretary setup — use default login once.</Muted>
          )}

          {!bootstrapMode && (
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <Pressable
                  key={r.value}
                  onPress={() => setRole(r.value)}
                  style={[styles.roleChip, role === r.value && styles.roleChipActive]}
                >
                  <Text style={[styles.roleChipText, role === r.value && styles.roleChipTextActive]}>
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Field
            label={bootstrapMode ? "Login ID" : "Mobile number"}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
            editable={!bootstrapMode}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <ErrorText>{error}</ErrorText> : null}

          <Button label="Sign in" onPress={onSubmit} loading={loading} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginTop: 24,
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  roleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  roleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  roleChipTextActive: {
    color: "#fff",
  },
});
