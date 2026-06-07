import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ApiError, api } from "../../api/client";
import type { GateLookup, SosAlert, StaffAttendanceEntry, Vehicle, Visitor } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { lookupRecordId, lookupTitle, recordStr } from "../../lib/gateLookup";
import type { SecurityStackParamList } from "../../navigation/types";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function GuardHomeScreen() {
  const { token, user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<SecurityStackParamList>>();
  const [otp, setOtp] = useState("");
  const [result, setResult] = useState<GateLookup | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [last4, setLast4] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [staffToday, setStaffToday] = useState<StaffAttendanceEntry[]>([]);

  const reload = useCallback(() => {
    if (!token) return;
    api.sosAlerts(token).then(setSosAlerts);
    api.visitors(token).then(setVisitors);
    api.staffAttendanceToday(token).then(setStaffToday);
  }, [token]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  useEffect(() => {
    const t = setInterval(reload, 8000);
    return () => clearInterval(t);
  }, [reload]);

  useEffect(() => {
    if (!token || last4.length !== 4) {
      setVehicles([]);
      return;
    }
    api.vehicles(token, last4).then(setVehicles).catch(() => setVehicles([]));
  }, [last4, token]);

  async function lookup() {
    if (!token || otp.trim().length < 4) {
      setError("Enter OTP code");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await api.gateLookup(token, otp.trim()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function checkInVisitor() {
    if (!token || !result || result.type !== "visitor") return;
    const id = lookupRecordId(result);
    if (!id) return;
    await api.checkInVisitor(token, id);
    setOtp("");
    setResult(null);
    reload();
  }

  async function checkOutVisitor(id?: string) {
    const vid = id ?? (result?.type === "visitor" ? lookupRecordId(result) : null);
    if (!token || !vid) return;
    await api.checkOutVisitor(token, vid);
    setOtp("");
    setResult(null);
    reload();
  }

  async function deliveryAction(status: string) {
    if (!token || !result || result.type !== "delivery") return;
    const id = lookupRecordId(result);
    if (!id) return;
    await api.updateDelivery(token, id, status);
    setOtp("");
    setResult(null);
    reload();
  }

  async function staffAction(checkIn: boolean) {
    if (!token || !result || result.type !== "staff") return;
    const id = lookupRecordId(result);
    if (!id) return;
    if (checkIn) await api.staffCheckIn(token, id);
    else await api.staffCheckOut(token, id);
    setOtp("");
    setResult(null);
    reload();
  }

  const openSos = sosAlerts.filter((s) => s.status === "OPEN");

  return (
    <Screen>
      <Muted>Guard: {user?.name}</Muted>

      {openSos.length > 0 && (
        <Card>
          <Subtitle>🚨 SOS alerts</Subtitle>
          {openSos.map((s) => (
            <View key={s.id}>
              <Text style={{ fontWeight: "700" }}>Flat {s.flat_label}</Text>
              <Muted>{s.message ?? "Emergency"}</Muted>
              <Button label="Resolve" onPress={() => token && api.resolveSos(token, s.id).then(reload)} />
            </View>
          ))}
        </Card>
      )}

      <Card>
        <Subtitle>Gate OTP lookup</Subtitle>
        <Field label="6-digit OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Look up" onPress={lookup} loading={loading} />
      </Card>

      {result && (
        <Card>
          <Subtitle>{lookupTitle(result)}</Subtitle>
          <Muted>Type: {result.type}</Muted>
          <Muted>Flat: {recordStr(result.record, "flat_label") ?? "—"}</Muted>
          {recordStr(result.record, "purpose") && <Muted>Purpose: {recordStr(result.record, "purpose")}</Muted>}
          {recordStr(result.record, "status") && <Muted>Status: {recordStr(result.record, "status")}</Muted>}
          {result.type === "visitor" && (
            <>
              <Button label="Check in" onPress={checkInVisitor} />
              <Button label="Check out" variant="secondary" onPress={() => checkOutVisitor()} />
            </>
          )}
          {result.type === "delivery" && (
            <>
              <Button label="Approve" onPress={() => deliveryAction("APPROVED")} />
              <Button label="Deny" variant="danger" onPress={() => deliveryAction("DENIED")} />
            </>
          )}
          {result.type === "staff" && (
            <>
              <Button label="Staff check in" onPress={() => staffAction(true)} />
              <Button label="Staff check out" variant="secondary" onPress={() => staffAction(false)} />
            </>
          )}
        </Card>
      )}

      <Card>
        <Subtitle>Vehicle search (last 4 digits)</Subtitle>
        <Field label="Last 4" value={last4} onChangeText={setLast4} keyboardType="number-pad" maxLength={4} />
        {vehicles.map((v) => (
          <Muted key={v.id}>{v.number} · Flat {v.flat_label} · {v.owner_name}</Muted>
        ))}
      </Card>

      <Subtitle>Visitors today</Subtitle>
      {visitors.slice(0, 5).map((v) => (
        <Card key={v.id}>
          <Muted>{v.guest_name} · Flat {v.flat_label} · {v.status}</Muted>
          {v.status === "CHECKED_IN" && (
            <Button label="Check out" variant="secondary" onPress={() => checkOutVisitor(v.id)} />
          )}
        </Card>
      ))}

      <Subtitle>Staff attendance</Subtitle>
      {staffToday.slice(0, 5).map((s) => (
        <Card key={s.id}>
          <Muted>{s.staff_name} · Flat {s.flat_label ?? "—"}</Muted>
          <Muted>
            {s.check_in ? `In ${new Date(s.check_in).toLocaleTimeString()}` : "Not in"}
            {s.check_out ? ` · Out ${new Date(s.check_out).toLocaleTimeString()}` : ""}
          </Muted>
        </Card>
      ))}

      {user?.role === "SECURITY" && (
        <Button label="Profile" variant="secondary" onPress={() => navigation.navigate("Profile")} />
      )}
    </Screen>
  );
}
