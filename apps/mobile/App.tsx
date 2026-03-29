import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import WebViewScreen from "./src/components/WebViewScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <WebViewScreen />
    </SafeAreaProvider>
  );
}
