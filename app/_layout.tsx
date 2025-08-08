import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { userIdAtom } from '@/atoms/global';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Provider, useAtom } from 'jotai';
import LoginScreen from './login-screen';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [userId, setUserId] = useAtom(userIdAtom);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  const handleLoginSuccess = ({newUserId}: {newUserId: number}) => {
    setUserId(newUserId);
  };

  if (userId === -1) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <Provider>
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="map-selection"
          options={{
            headerShown: true,
            title: "Choose Location",
            headerBackTitle: "Back",
            headerStyle: {
              backgroundColor: "#007AFF",
            },
            headerTintColor: "#fff",
            animation: 'slide_from_right',
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
        <Stack.Screen
          name="show-plan"
          options={{
            headerShown: true,
            title: "Travel Plan",
            headerBackTitle: "Back",
            headerStyle: {
              backgroundColor: "#007AFF",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
        <Stack.Screen
          name="place-detail"
          options={{
            headerShown: true,
            title: "Place Location",
            headerBackTitle: "Back",
            headerStyle: {
              backgroundColor: "#007AFF",
            },
            headerTintColor: "#fff",
            animation: 'slide_from_right',
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
    </Provider>
  );
}
