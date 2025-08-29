import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { ListItem } from "../components/ListItem";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "lightgray"
  }
});

// @ts-ignore
const uiManager = global?.nativeFabricUIManager ? "Fabric" : "Paper";

export function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <SafeAreaView />
      <ScrollView style={styles.container} contentContainerStyle={{}}>
        <Text>{uiManager}</Text>
        <ListItem
          title="Ad Screen"
          onPress={() => navigation.navigate("AdScreen")}
        />
        <ListItem
          title="Ads Screen"
          onPress={() => navigation.navigate("AdsScreen")}
        />
        <ListItem
          title="Manager Screen"
          onPress={() => navigation.navigate("ManagerScreen")}
        />
        <ListItem
          title="AdConsent Screen"
          onPress={() => navigation.navigate("AdConsentScreen")}
        />
      </ScrollView>
    </View>
  );
}
