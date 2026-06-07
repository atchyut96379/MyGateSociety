import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { colors } from "../theme";

export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  if (!scroll) {
    return <View style={[styles.screen, style]}>{children}</View>;
  }
  return (
    <ScrollView
      style={[styles.screen, style]}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.error}>{children}</Text>;
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  variant = "primary",
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}) {
  const variantStyle =
    variant === "secondary"
      ? styles.btnSecondary
      : variant === "danger"
        ? styles.btnDanger
        : styles.btnPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        variantStyle,
        (disabled || loading) && styles.btnDisabled,
        pressed && styles.btnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.btnText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function FeatureTile({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: colors.error,
    fontSize: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
    color: colors.text,
  },
  btn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.muted,
  },
  btnDanger: {
    backgroundColor: colors.error,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tile: {
    width: "48%",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 110,
  },
  tilePressed: {
    opacity: 0.9,
  },
  tileIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  tileSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
});
