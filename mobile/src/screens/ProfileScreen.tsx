import { useNavigation } from "@react-navigation/native";
import { Button, Card, Muted, Screen, Subtitle } from "../components/ui";
import { useAuth } from "../auth/AuthContext";

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  return (
    <Screen>
      <Card>
        <Subtitle>{user?.name}</Subtitle>
        <Muted>Role: {user?.role}</Muted>
        <Muted>Mobile: {user?.phone}</Muted>
        {user?.flat_label ? <Muted>Flat: {user.flat_label}</Muted> : null}
        {user?.email ? <Muted>Email: {user.email}</Muted> : null}
        {user?.must_change_password ? (
          <Muted>Please change your password (use button below).</Muted>
        ) : null}
      </Card>
      <Button
        label="Change password"
        variant="secondary"
        onPress={() => navigation.navigate("ChangePassword" as never)}
      />
      <Button label="Sign out" variant="secondary" onPress={() => void logout()} />
    </Screen>
  );
}
