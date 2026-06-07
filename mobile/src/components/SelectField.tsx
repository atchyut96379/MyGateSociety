import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { colors } from "../theme";

type Option = { value: string; label: string };

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>{selected?.label ?? placeholder}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {options.map((o) => (
              <Pressable
                key={o.value}
                style={[styles.option, o.value === value && styles.optionActive]}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                <Text style={[styles.optionText, o.value === value && styles.optionTextActive]}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  triggerText: { fontSize: 15, color: colors.text, flex: 1 },
  chevron: { color: colors.muted, fontSize: 14, marginLeft: 8 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "70%",
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12, color: colors.text },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionActive: { backgroundColor: "#ecfdf5" },
  optionText: { fontSize: 15, color: colors.text },
  optionTextActive: { color: colors.primary, fontWeight: "600" },
});
