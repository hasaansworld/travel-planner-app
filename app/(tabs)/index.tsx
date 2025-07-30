import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function TravelPlanningScreen() {
  const [placeName, setPlaceName] = useState("");
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

  const handleCreatePlan = () => {
    if (!placeName.trim()) {
      Alert.alert("Error", "Please enter a place name");
      return;
    }

    const locationInfo = location
      ? `\nCurrent Location: ${location.latitude.toFixed(
          6
        )}, ${location.longitude.toFixed(6)}`
      : "\nLocation: Not available";

    Alert.alert(
      "Plan Created!",
      `Place: ${placeName}\nRating: ${rating}\nRadius: ${radius}km\nDays: ${numberOfDays}\nDate: ${selectedDate.toDateString()}\nMessage: ${message}${locationInfo}`
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

        {/* Place Name Input */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="subtitle" style={styles.label}>
            Place Name
          </ThemedText>
          <TextInput
            style={styles.textInput}
            value={placeName}
            onChangeText={setPlaceName}
            placeholder="Enter destination"
            placeholderTextColor="#999"
          />
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
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
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
