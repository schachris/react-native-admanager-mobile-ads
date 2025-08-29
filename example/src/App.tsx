import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PackageConfig } from "react-native-admanager-mobile-ads";

import { AdConsentScreen } from "./screens/AdConsentScreen";
import { AdScreen } from "./screens/AdScreen";
import { AdsScreen } from "./screens/AdsScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ManagerScreen } from "./screens/ManagerScreen";

const ManagerStack = createNativeStackNavigator();

PackageConfig.logging = true;

export default function RootApp() {
  return (
    <NavigationContainer>
      <ManagerStack.Navigator screenOptions={{ headerShown: false }}>
        <ManagerStack.Screen name="Home" component={HomeScreen} />
        <ManagerStack.Screen name="AdScreen" component={AdScreen} />
        <ManagerStack.Screen name="AdsScreen" component={AdsScreen} />
        <ManagerStack.Screen name="ManagerScreen" component={ManagerScreen} />
        <ManagerStack.Screen
          name="AdConsentScreen"
          component={AdConsentScreen}
        />
      </ManagerStack.Navigator>
    </NavigationContainer>
  );
}
