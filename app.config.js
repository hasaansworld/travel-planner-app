export default {
  expo: {
    name: "travel-planner-app",
    slug: "travel-planner-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "travelplannerapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        UIBackgroundModes: [
          "location",
          "background-fetch",
          "background-processing"
        ],
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs location access to automatically check you in to nearby places for travel planning.",
        NSLocationWhenInUseUsageDescription: "This app needs location access to find nearby places for travel planning.",
        NSLocationAlwaysUsageDescription: "This app needs background location access to automatically check you in to nearby places when the app is not active."
      }
    },
    android: {
      package: "com.ubicomp.travelplanner",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: "pan",
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_LOCATION",
        "android.permission.WAKE_LOCK"
      ],
      googleServicesFile: "./google-services.json",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow this app to use your location for automatic check-ins and travel planning.",
          locationAlwaysPermission: "Allow this app to use your location for automatic check-ins even when the app is in the background.",
          locationWhenInUsePermission: "This app uses location for travel planning and check-ins.",
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true
        }
      ],
      [
        "@react-native-google-signin/google-signin"
      ],
      [
        "react-native-maps",
        {
          iosGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
          androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      ],
      "expo-task-manager",
      "expo-background-fetch"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "b323f9a0-9abb-409a-8255-6cbda014a1a3"
      }
    }
  }
}