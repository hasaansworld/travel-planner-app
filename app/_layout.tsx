import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as TaskManager from 'expo-task-manager';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { apiKeyAtom, placesApiKeyAtom, userIdAtom } from '@/atoms/global';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Provider, useAtom } from 'jotai';
import LoginScreen from './login-screen';

// Import the background service to register tasks
import '@/utils/backgroundLocationService';

const SETTINGS_KEY = "@user_settings";

function AppContent() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [userId, setUserId] = useAtom(userIdAtom);
  const [, setApiKey] = useAtom(apiKeyAtom);
  const [, setPlacesApiKey] = useAtom(placesApiKeyAtom);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Initialize background tasks on app startup
  useEffect(() => {
    const initializeBackgroundTasks = async () => {
      try {
        const registeredTasks = await TaskManager.getRegisteredTasksAsync();
        console.log('Registered background tasks:', registeredTasks);
      } catch (error) {
        console.error('Error initializing background tasks:', error);
      }
    };

    initializeBackgroundTasks();
  }, []);

  // Check for stored user_id and settings on app startup
  useEffect(() => {
    const checkStoredData = async () => {
      try {
        // Check for stored user_id
        const storedUserId = await AsyncStorage.getItem('user_id');
        if (storedUserId) {
          const parsedUserId = parseInt(storedUserId, 10);
          if (!isNaN(parsedUserId)) {
            setUserId(parsedUserId);
          }
        }

        // Check for stored settings (including API keys)
        const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        if (storedSettings) {
          const settings = JSON.parse(storedSettings);
          if (settings.apiKey) {
            setApiKey(settings.apiKey);
          }
          if (settings.placesApiKey) {
            console.log("Places key", settings.placesApiKey)
            setPlacesApiKey(settings.placesApiKey);
          }
        }
      } catch (error) {
        console.error('Error checking stored data:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkStoredData();
  }, [setUserId, setApiKey, setPlacesApiKey]);

  // Show loading screen while checking authentication
  if (!loaded || isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleLoginSuccess = () => {
    // The login screen already saves the user_id to AsyncStorage
    // We just need to read it and update the atom
    const refreshUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('user_id');
        if (storedUserId) {
          const parsedUserId = parseInt(storedUserId, 10);
          if (!isNaN(parsedUserId)) {
            setUserId(parsedUserId);
          }
        }
      } catch (error) {
        console.error('Error refreshing user_id:', error);
      }
    };
    
    refreshUserId();
  };

  // Show login screen if no user_id is found
  if (userId === -1 || userId === null || userId === undefined) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
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
  );
}

export default function RootLayout() {
  return (
    <Provider>
      <AppContent />
    </Provider>
  );
}
