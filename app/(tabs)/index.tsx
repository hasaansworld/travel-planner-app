import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import {
  useFocusEffect,
  useNavigation,
  useRoute
} from "@react-navigation/native";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useRouter } from "expo-router";

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface SelectedLocation {
  coords: LocationCoords;
  name?: string;
}

export default function TravelPlanningScreen() {
  const [placeName, setPlaceName] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [rating, setRating] = useState(3.0);
  const [radius, setRadius] = useState(5);
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const navigation = useNavigation();
  const route = useRoute();
  const router = useRouter();

  // Request location permission and get current location
  const requestLocationPermission = async () => {
    try {
      // Request foreground location permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationError("Location permission denied");
        Alert.alert(
          "Permission Denied",
          "Location permission is required for this feature."
        );
        return;
      }

      console.log("Location permission granted");
      setLocationPermissionGranted(true);
      getCurrentLocation();
    } catch (error) {
      console.warn("Error requesting location permission:", error);
      setLocationError("Failed to request location permission");
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setLocationError(null);

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      const coords = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
      };

      setLocation(coords);
      console.log("Current location:", coords);
      console.log(
        `Latitude: ${coords.latitude}, Longitude: ${coords.longitude}`
      );
    } catch (error) {
      console.log("Location error:", error);
      setLocationError("Unable to get location");
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please try again."
      );
    }
  };

  // Request location permission on component mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Handle navigation result from map screen
  useFocusEffect(
    useCallback(() => {
      const params = route.params as any;

      if (params?.selectedLocation) {
        const { coords, name } = params.selectedLocation;
        setSelectedLocation({ coords, name });
        setPlaceName(
          name ||
            `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
        );

        // Clear params after handling (must be done via navigation.setParams)
        (navigation as any).setParams({ selectedLocation: null });
      }
    }, [route.params])
  );

  const handleChooseOnMap = () => {
    // Navigate to map screen with current location as initial position
    const initialLocation = selectedLocation?.coords ||
      location || {
        latitude: 37.78825,
        longitude: -122.4324, // Default to San Francisco if no location available
      };

    router.push({
      pathname: "/map-selection",
      params: {
        initialLat: initialLocation.latitude.toString(),
        initialLng: initialLocation.longitude.toString(),
        returnScreen: "/(tabs)/index",
      },
    });
  };

  const handleCreatePlan = () => {
    const finalPlaceName = placeName.trim();
    if (!finalPlaceName) {
      Alert.alert(
        "Error",
        "Please enter a place name or choose a location on the map"
      );
      return;
    }

    const locationInfo = selectedLocation
      ? `\nSelected Location: ${selectedLocation.coords.latitude.toFixed(
          6
        )}, ${selectedLocation.coords.longitude.toFixed(6)}`
      : location
      ? `\nCurrent Location: ${location.latitude.toFixed(
          6
        )}, ${location.longitude.toFixed(6)}`
      : "\nLocation: Not available";

    Alert.alert(
      "Plan Created!",
      `Place: ${finalPlaceName}\nRating: ${rating}\nRadius: ${radius}km\nDays: ${numberOfDays}\nDate: ${selectedDate.toDateString()}\nMessage: ${message}${locationInfo}`
    );
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Travel Planning
        </ThemedText>

        {/* Place Name Input with Map Button */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="subtitle" style={styles.label}>
            Place Name
          </ThemedText>
          <View style={styles.placeInputRow}>
            <TextInput
              style={[styles.textInput, styles.placeInput]}
              value={placeName}
              onChangeText={setPlaceName}
              placeholder="Enter destination or choose on map"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.mapButton}
              onPress={handleChooseOnMap}
            >
              <ThemedText style={styles.mapButtonText}>
                Choose on Map
              </ThemedText>
            </TouchableOpacity>
          </View>
          {selectedLocation && (
            <ThemedText style={styles.coordinatesText}>
              Selected: {selectedLocation.coords.latitude.toFixed(6)},{" "}
              {selectedLocation.coords.longitude.toFixed(6)}
            </ThemedText>
          )}
        </ThemedView>

        {/* Rating Slider */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="subtitle" style={styles.label}>
            Rating: {rating.toFixed(1)}
          </ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={5}
            value={rating}
            onValueChange={setRating}
            step={0.1}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#E0E0E0"
            thumbStyle={styles.sliderThumb}
          />
        </ThemedView>

        {/* Radius Slider */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="subtitle" style={styles.label}>
            Radius: {radius}km
          </ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={50}
            value={radius}
            onValueChange={setRadius}
            step={1}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#E0E0E0"
            thumbStyle={styles.sliderThumb}
          />
        </ThemedView>

        {/* Number of Days Slider */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="subtitle" style={styles.label}>
            Number of Days: {numberOfDays}
          </ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            value={numberOfDays}
            onValueChange={setNumberOfDays}
            step={1}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#E0E0E0"
            thumbStyle={styles.sliderThumb}
          />
        </ThemedView>

        {/* Date Picker */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="subtitle" style={styles.label}>
            When
          </ThemedText>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <ThemedText style={styles.dateButtonText}>
              {selectedDate.toDateString()}
            </ThemedText>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </ThemedView>

        {/* Message Input */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="subtitle" style={styles.label}>
            Message
          </ThemedText>
          <TextInput
            style={[styles.textInput, styles.messageInput]}
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your travel intentions..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </ThemedView>

        {/* Create Plan Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreatePlan}
        >
          <ThemedText style={styles.createButtonText}>Create Plan</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    textAlign: "center",
    marginBottom: 30,
    fontSize: 28,
    fontWeight: "bold",
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  placeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  placeInput: {
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  mapButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 10,
    minWidth: 120,
    alignItems: "center",
  },
  mapButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  coordinatesText: {
    marginTop: 5,
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  messageInput: {
    height: 100,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderThumb: {
    backgroundColor: "#007AFF",
    width: 20,
    height: 20,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },
  createButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
