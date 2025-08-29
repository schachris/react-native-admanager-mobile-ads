import { Text, TouchableOpacity, View } from "react-native";

export function ListItem({
  title,
  onPress
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={{ marginVertical: 4 }}>
      <View
        style={{
          backgroundColor: "white",
          paddingHorizontal: 16,
          paddingVertical: 6,
          minHeight: 44,
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>{title}</Text>
        <Text>{">"}</Text>
      </View>
    </TouchableOpacity>
  );
}
