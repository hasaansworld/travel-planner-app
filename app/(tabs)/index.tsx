import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import * as Location from "expo-location";
import { useAtom } from "jotai";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useRouter } from "expo-router";
import { placesApi } from "../../utils/api"; // Import the places API
import { selectedLocationAtom } from "../map-selection"; // Import the atom

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface SelectedLocation {
  coords: LocationCoords;
  name?: string;
}

interface AutocompleteSuggestion {
  place_id: string;
  text: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

export default function TravelPlanningScreen() {
  const [placeName, setPlaceName] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [rating, setRating] = useState(3.0);
  const [radius, setRadius] = useState(5);
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [sessionToken] = useState(() =>
    Math.random().toString(36).substring(7)
  );

  // Error state for API calls
  const [apiError, setApiError] = useState<string | null>(null);

  // Refs for debouncing and cancellation
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use Jotai atom for selected location from map
  const [selectedLocationFromAtom] = useAtom(selectedLocationAtom);

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

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setApiError(null); // Clear error when query is too short
      return;
    }

    try {
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setIsLoadingSuggestions(true);
      setApiError(null); // Clear previous errors
      console.log("Fetching suggestions for:", query);

      const response = await placesApi.autocomplete(query, sessionToken);
      console.log("Autocomplete response:", response);
      console.log(typeof response);
      console.log(response.success, response.data);

      if (
        response.status === "success" &&
        response.suggestions &&
        Array.isArray(response.suggestions)
      ) {
        console.log("Setting suggestions:", response.suggestions);
        setSuggestions(response.suggestions);
        setShowSuggestions(response.suggestions.length > 0);
        setApiError(null); // Clear error on success
      } else {
        console.log("No suggestions found or invalid response");
        setSuggestions([]);
        setShowSuggestions(false);
        if (response.message) {
          setApiError(response.message);
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
        
        // Set user-friendly error message
        if (error.message.includes('Network request failed')) {
          setApiError("Network error: Please check your internet connection");
        } else if (error.message.includes('timeout')) {
          setApiError("Request timeout: Please try again");
        } else if (error.message.includes('HTTP error')) {
          setApiError("Server error: Unable to fetch suggestions");
        } else {
          setApiError("Failed to fetch suggestions. Please try again.");
        }
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle place name input change with debouncing
  const handlePlaceNameChange = (text: string) => {
    setPlaceName(text);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (text.trim().length === 0) {
      setSelectedLocation(null);
      setApiError(null); // Clear error when input is empty
    }

    // Hide suggestions immediately when typing
    if (text.trim().length < 2) {
      setShowSuggestions(false);
      setSuggestions([]);
      setApiError(null); // Clear error for short queries
      return;
    }

    // Set new timeout for 1 second
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 1000);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: AutocompleteSuggestion) => {
    console.log("Selected suggestion:", suggestion);

    // Set the main text (place name) in the input field
    setPlaceName(suggestion.structured_formatting.main_text);
    setShowSuggestions(false);
    setSuggestions([]);
    setApiError(null); // Clear any existing errors

    try {
      console.log("Fetching place details for:", suggestion.place_id);
      // Fetch place details to get coordinates
      const response = await placesApi.placeDetails(suggestion.place_id);
      console.log("Place details response:", response);

      if (response.status === "success" && response.place) {
        const place = response.place;
        console.log("Setting selected location:", place);

        setSelectedLocation({
          coords: {
            latitude: place.location.latitude,
            longitude: place.location.longitude,
          },
          name: place.name,
        });
        setApiError(null); // Clear error on success
      } else {
        console.error("Invalid place details response:", response);
        setApiError("Failed to get location details for selected place");
      }
    } catch (error: any) {
      console.error("Error fetching place details:", error);
      
      // Set user-friendly error message
      if (error.message.includes('Network request failed')) {
        setApiError("Network error: Please check your internet connection");
      } else if (error.message.includes('timeout')) {
        setApiError("Request timeout: Please try again");
      } else if (error.message.includes('HTTP error')) {
        setApiError("Server error: Unable to get place details");
      } else {
        setApiError("Failed to get location details. Please try again.");
      }
    }
  };

  // Request location permission on component mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Update place name when location is selected from Jotai atom
  useEffect(() => {
    if (selectedLocationFromAtom) {
      setSelectedLocation(selectedLocationFromAtom);
      // Only update place name field with the selected location name
      setPlaceName(selectedLocationFromAtom.name || "");
      setApiError(null); // Clear any existing errors
    }
  }, [selectedLocationFromAtom]);

  // Handle navigation result from map screen (keeping for backward compatibility)
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
        setApiError(null); // Clear any existing errors

        // Clear params after handling (must be done via navigation.setParams)
        (navigation as any).setParams({ selectedLocation: null });
      }
    }, [route.params])
  );

  // Cleanup timeouts and abort controllers
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleChooseOnMap = () => {
    // Hide suggestions when navigating to map
    setShowSuggestions(false);
    setApiError(null); // Clear any existing errors

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

    router.push({
      pathname: "/show-plan",
      params: {
        lat: selectedLocation?.coords.latitude,
        long: selectedLocation?.coords.longitude,
        radius: radius,
        rating: rating,
        numberOfDays: numberOfDays,
        startDate: selectedDate.toISOString(),
        message: message.trim(),
      },
    });
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Travel Planning
        </ThemedText>

        {/* Place Name Input with Map Button and Autocomplete */}
        <ThemedView style={styles.inputContainer}>
          <ThemedText type="subtitle" style={styles.label}>
            Place Name
          </ThemedText>
          <View style={styles.placeInputRow}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.textInput, styles.placeInput]}
                value={placeName}
                onChangeText={handlePlaceNameChange}
                placeholder="Enter destination or choose on map"
                placeholderTextColor="#999"
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
              />
              {isLoadingSuggestions && (
                <ThemedText style={styles.loadingText}>Searching...</ThemedText>
              )}

              {/* Autocomplete suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <ScrollView
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    {suggestions.map((item) => (
                      <TouchableOpacity
                        key={item.place_id}
                        style={styles.suggestionItem}
                        onPress={() => handleSuggestionSelect(item)}
                      >
                        <ThemedText style={styles.suggestionMainText}>
                          {item.structured_formatting.main_text}
                        </ThemedText>
                        <ThemedText style={styles.suggestionSecondaryText}>
                          {item.structured_formatting.secondary_text}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.mapButton}
              onPress={handleChooseOnMap}
            >
              <ThemedText style={styles.mapButtonText}>
                Choose on Map
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Error message display */}
          {apiError && (
            <ThemedText style={styles.errorText}>
              {apiError}
            </ThemedText>
          )}

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
          style={[
            styles.createButton,
            (!selectedLocation || !message.trim()) &&
              styles.createButtonDisabled,
          ]}
          onPress={handleCreatePlan}
          disabled={!selectedLocation || !message.trim()}
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
    paddingBottom: 180,
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
    alignItems: "flex-start",
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    position: "relative",
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
  loadingText: {
    position: "absolute",
    right: 12,
    top: 12,
    fontSize: 12,
    color: "#007AFF",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionMainText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  suggestionSecondaryText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  debugText: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  mapButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 10,
    minWidth: 120,
    alignItems: "center",
    marginTop: 0,
  },
  mapButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: "#FF3B30",
    fontWeight: "500",
    lineHeight: 18,
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
    marginTop: 0,
  },
  createButtonDisabled: {
    backgroundColor: "#aaa",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
