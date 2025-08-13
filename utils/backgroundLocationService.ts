// backgroundLocationService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundFetch from "expo-background-fetch";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { placesApi } from "./api";

const BACKGROUND_LOCATION_TASK = "background-location-task";
const BACKGROUND_FETCH_TASK = "background-fetch-task";
const LAST_CHECKIN_KEY = "last_auto_checkin";
const MIN_CHECKIN_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

interface UserVisitData {
  user_id: string;
  lat: number;
  long: number;
  name: string;
  place_type: string;
  address: string;
  created_at: string;
}

// Helper function to get stored user data
const getUserData = async () => {
  try {
    const userId = await AsyncStorage.getItem("user_id");
    const placesApiKey = await AsyncStorage.getItem("places_api_key");
    return { userId, placesApiKey };
  } catch (error) {
    console.error("Error getting user data:", error);
    return { userId: null, placesApiKey: null };
  }
};

// Helper function to check if enough time has passed since last check-in
const shouldCreateCheckin = async (): Promise<boolean> => {
  try {
    const lastCheckinStr = await AsyncStorage.getItem(LAST_CHECKIN_KEY);
    if (!lastCheckinStr) return true;
    
    const lastCheckin = parseInt(lastCheckinStr);
    const now = Date.now();
    return (now - lastCheckin) >= MIN_CHECKIN_INTERVAL;
  } catch (error) {
    console.error("Error checking last checkin time:", error);
    return true;
  }
};

// Helper function to update last check-in time
const updateLastCheckinTime = async () => {
  try {
    await AsyncStorage.setItem(LAST_CHECKIN_KEY, Date.now().toString());
  } catch (error) {
    console.error("Error updating last checkin time:", error);
  }
};

// Helper function to create datetime string
const createDateTime = (date: Date = new Date()): string => {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localTime = new Date(date.getTime() - timezoneOffset);
  return localTime.toISOString();
};

// Main function to handle automatic check-in
const handleAutomaticCheckin = async (location: Location.LocationObject) => {
  try {
    const { userId, placesApiKey } = await getUserData();
    
    if (!userId || !placesApiKey) {
      console.log("Missing user data for automatic check-in");
      return;
    }

    if (!(await shouldCreateCheckin())) {
      console.log("Too soon for another automatic check-in");
      return;
    }

    const lat = location.coords.latitude;
    const long = location.coords.longitude;

    // Get nearby places
    const response = await placesApi.getNearbyPlaces({
      lat,
      long,
      places_api_key: placesApiKey
    });

    if (!response.places || response.places.length === 0) {
      console.log("No nearby places found for automatic check-in");
      return;
    }

    // Get the closest place (first in the array is usually closest)
    const closestPlace = response.places[0];

    // Create automatic check-in
    const visitData: UserVisitData = {
      user_id: userId,
      lat: closestPlace.location.latitude,
      long: closestPlace.location.longitude,
      name: closestPlace.name,
      place_type: closestPlace.types?.[0] || "Unknown",
      address: closestPlace.address,
      created_at: createDateTime(),
    };

    await placesApi.createUserVisit(visitData);
    await updateLastCheckinTime();
    
    console.log(`Automatic check-in successful at: ${closestPlace.name}`);
  } catch (error) {
    console.error("Error during automatic check-in:", error);
  }
};

// Background location task definition
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Background location task error:", error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      const latestLocation = locations[locations.length - 1];
      await handleAutomaticCheckin(latestLocation);
    }
  }
});

// Background fetch task definition (alternative/backup method)
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Background location permission not granted");
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    await handleAutomaticCheckin(location);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background fetch task error:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Service class to manage background location tracking
export class BackgroundLocationService {
  private static isLocationStarted = false;
  private static isFetchStarted = false;

  // Start background location tracking
  static async startLocationTracking(): Promise<boolean> {
    try {
      // Request permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== "granted") {
        console.error("Foreground location permission not granted");
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== "granted") {
        console.error("Background location permission not granted");
        return false;
      }

      // Check if task is already defined
      const isTaskDefined = await TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK);
      if (!isTaskDefined) {
        console.error("Background location task is not defined");
        return false;
      }

      // Start location updates
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: MIN_CHECKIN_INTERVAL, // 15 minutes
        distanceInterval: 100, // Update if moved 100 meters
        deferredUpdatesInterval: MIN_CHECKIN_INTERVAL,
        foregroundService: {
          notificationTitle: "Location Tracking",
          notificationBody: "Tracking your location for automatic check-ins",
        },
        pausesUpdatesAutomatically: false,
      });

      this.isLocationStarted = true;
      console.log("Background location tracking started");
      return true;
    } catch (error) {
      console.error("Error starting background location tracking:", error);
      return false;
    }
  }

  // Stop background location tracking
  static async stopLocationTracking(): Promise<void> {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        this.isLocationStarted = false;
        console.log("Background location tracking stopped");
      }
    } catch (error) {
      console.error("Error stopping background location tracking:", error);
    }
  }

  // Start background fetch (alternative method)
  static async startBackgroundFetch(): Promise<boolean> {
    try {
      const isTaskDefined = await TaskManager.isTaskDefined(BACKGROUND_FETCH_TASK);
      if (!isTaskDefined) {
        console.error("Background fetch task is not defined");
        return false;
      }

      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: MIN_CHECKIN_INTERVAL / 1000, // Convert to seconds
        stopOnTerminate: false,
        startOnBoot: true,
      });

      this.isFetchStarted = true;
      console.log("Background fetch started");
      return true;
    } catch (error) {
      console.error("Error starting background fetch:", error);
      return false;
    }
  }

  // Stop background fetch
  static async stopBackgroundFetch(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      this.isFetchStarted = false;
      console.log("Background fetch stopped");
    } catch (error) {
      console.error("Error stopping background fetch:", error);
    }
  }

  // Start all background services
  static async startAll(): Promise<boolean> {
    const locationStarted = await this.startLocationTracking();
    const fetchStarted = await this.startBackgroundFetch();
    
    return locationStarted || fetchStarted; // Return true if at least one method works
  }

  // Stop all background services
  static async stopAll(): Promise<void> {
    await this.stopLocationTracking();
    await this.stopBackgroundFetch();
  }

  // Check if services are running
  static async getStatus(): Promise<{
    locationTracking: boolean;
    backgroundFetch: boolean;
  }> {
    try {
      const locationRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      const fetchRunning = await BackgroundFetch.getStatusAsync();
      
      return {
        locationTracking: locationRunning,
        backgroundFetch: fetchRunning === BackgroundFetch.BackgroundFetchStatus.Available,
      };
    } catch (error) {
      console.error("Error getting service status:", error);
      return {
        locationTracking: false,
        backgroundFetch: false,
      };
    }
  }

  // Manual trigger for testing
  static async triggerManualCheckin(): Promise<boolean> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      await handleAutomaticCheckin(location);
      return true;
    } catch (error) {
      console.error("Error during manual trigger:", error);
      return false;
    }
  }
}

// Export for use in app
export default BackgroundLocationService;