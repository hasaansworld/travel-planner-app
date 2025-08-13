import { placesApiKeyAtom, userIdAtom } from "@/atoms/global";
import { IconSymbol } from "@/components/ui/IconSymbol";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from "expo-location";
import { useAtom } from "jotai";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { placesApi } from "../../utils/api"; // adjust import as needed

const placeholderImage =
  "https://hds.hel.fi/images/foundation/visual-assets/placeholders/image-m@3x.png";

interface AutocompleteSuggestion {
  place_id: string;
  text: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

export default function CheckInScreen() {
  const [location, setLocation] = useState<{
    lat: number;
    long: number;
  } | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [viewingAlternatives, setViewingAlternatives] = useState(false);

  // Manual check-in states
  const [manualPlaceName, setManualPlaceName] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [sessionToken] = useState(() =>
    Math.random().toString(36).substring(7)
  );
  const [selectedManualPlace, setSelectedManualPlace] = useState<any>(null);
  const [manualCheckInLoading, setManualCheckInLoading] = useState(false);

  // Time picker states
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Refs for debouncing and cancellation
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [userId] = useAtom(userIdAtom);
  const [placesApiKey] = useAtom(placesApiKeyAtom);

  const fetchLocationAndPlaces = useCallback(async () => {
    setLoading(true);
    setCheckInSuccess(false);
    setViewingAlternatives(false);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        setLoading(false);
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({});
      const lat = userLocation.coords.latitude;
      const long = userLocation.coords.longitude;
      setLocation({ lat, long });

      const res = await placesApi.getNearbyPlaces({ 
        lat, 
        long, 
        places_api_key: placesApiKey || ""
      });
      
      const fetchedPlaces = res.places || [];
      setPlaces(fetchedPlaces);
      
      // Fixed: Log places after they're set, and only if there are places
      if (fetchedPlaces.length > 0) {
        fetchedPlaces.forEach((place) => {
          console.log("Photos for place:", place.name, place.photos);
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch location or places.");
    } finally {
      setLoading(false);
    }
  }, [placesApiKey]); // Remove loading dependency

  const checkIn = async (place: any) => {
    try {
      setLoading(true);
      await placesApi.createUserVisit({
        user_id: userId,
        lat: place.location.latitude,
        long: place.location.longitude,
        name: place.name,
        place_type: place.types?.[0] || "Unknown",
        address: place.address,
        created_at: createDateTime(new Date()),
      });
      setCheckInSuccess(true);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Check-in failed.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch autocomplete suggestions for manual check-in
  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
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
      console.log("Fetching suggestions for:", query);

      const response = await placesApi.autocomplete(
        query, 
        sessionToken, 
        placesApiKey || ""
      );
      console.log("Autocomplete response:", response);

      if (
        response.status === "success" &&
        response.suggestions &&
        Array.isArray(response.suggestions)
      ) {
        console.log("Setting suggestions:", response.suggestions);
        setSuggestions(response.suggestions);
        setShowSuggestions(response.suggestions.length > 0);
      } else {
        console.log("No suggestions found or invalid response");
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle manual place name input change with debouncing
  const handleManualPlaceNameChange = (text: string) => {
    setManualPlaceName(text);
    setSelectedManualPlace(null);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (text.trim().length === 0) {
      setSelectedManualPlace(null);
    }

    // Hide suggestions immediately when typing
    if (text.trim().length < 2) {
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 1000);
  };

  // Handle suggestion selection for manual check-in
  const handleSuggestionSelect = async (suggestion: AutocompleteSuggestion) => {
    console.log("Selected suggestion:", suggestion);

    // Set the main text (place name) in the input field
    setManualPlaceName(suggestion.structured_formatting.main_text);
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      console.log("Fetching place details for:", suggestion.place_id);
      // Fetch place details to get coordinates
      const response = await placesApi.placeDetails(
        suggestion.place_id, 
        undefined, 
        placesApiKey || ""
      );
      console.log("Place details response:", response);

      if (response.status === "success" && response.place) {
        const place = response.place;
        console.log("Setting selected manual place:", place);

        setSelectedManualPlace({
          name: place.name,
          location: {
            latitude: place.location.latitude,
            longitude: place.location.longitude,
          },
          address: place.formatted_address || place.address || place.name,
          types: place.types || ["establishment"],
        });
      } else {
        console.error("Invalid place details response:", response);
        Alert.alert(
          "Error",
          "Failed to get location details for selected place"
        );
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      Alert.alert("Error", "Failed to get location details for selected place");
    }
  };

  // Handle time picker change
  const onTimeChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || selectedTime;
    setShowTimePicker(Platform.OS === 'ios');
    setSelectedTime(currentDate);
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Create datetime for API call
  const createDateTime = (time: Date) => {
    const now = new Date();
    const dateTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds()
    ); 
    // Get timezone offset in minutes and convert to milliseconds
    const timezoneOffset = dateTime.getTimezoneOffset() * 60000;
    // Adjust for timezone to get local time
    const localTime = new Date(dateTime.getTime() - timezoneOffset);
    return localTime.toISOString();
  };

  // Handle manual check-in
  const handleManualCheckIn = async () => {
    if (!selectedManualPlace) {
      Alert.alert("Error", "Please select a place from the search results.");
      return;
    }

    try {
      setManualCheckInLoading(true);
      await placesApi.createUserVisit({
        user_id: userId,
        lat: selectedManualPlace.location.latitude,
        long: selectedManualPlace.location.longitude,
        name: selectedManualPlace.name,
        place_type: selectedManualPlace.types?.[0] || "Unknown",
        address: selectedManualPlace.address,
        created_at: createDateTime(selectedTime),
      });

      // Reset manual check-in form
      setManualPlaceName("");
      setSelectedManualPlace(null);
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedTime(new Date()); // Reset time to current time

      setCheckInSuccess(true);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Manual check-in failed.");
    } finally {
      setManualCheckInLoading(false);
    }
  };

  // Fixed: Simplified useEffect - only run once when component mounts with required data
  useEffect(() => {
    fetchLocationAndPlaces();
  }, [fetchLocationAndPlaces]); // Empty dependency array - only run once on mount

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

  if (loading && !manualCheckInLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (checkInSuccess) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.successCard}>
          <View>
            <IconSymbol
              name="checkmark.circle.fill"
              size={80}
              color="#34C759"
            />
          </View>
          <Text style={styles.successText}>Check-in successful!</Text>
          <TouchableOpacity
            style={styles.blueButton}
            onPress={fetchLocationAndPlaces}
          >
            <Text style={styles.buttonText}>Check in again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!places.length) {
    return (
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.centerContainer}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No nearby places found.</Text>
            <TouchableOpacity
              style={styles.blueButton}
              onPress={fetchLocationAndPlaces}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>

          {/* Manual Check-in Section */}
          <View style={styles.manualCheckInSection}>
            <Text style={styles.manualCheckInHeading}>Manual check-in</Text>

            <View style={styles.manualInputContainer}>
              <Text style={styles.manualInputLabel}>Search for places</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.manualTextInput}
                  value={manualPlaceName}
                  onChangeText={handleManualPlaceNameChange}
                  placeholder="Enter place name..."
                  placeholderTextColor="#999"
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                />
                {isLoadingSuggestions && (
                  <Text style={styles.loadingText}>Searching...</Text>
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
                          <Text style={styles.suggestionMainText}>
                            {item.structured_formatting.main_text}
                          </Text>
                          <Text style={styles.suggestionSecondaryText}>
                            {item.structured_formatting.secondary_text}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {selectedManualPlace && (
                <Text style={styles.selectedPlaceText}>
                  Selected: {selectedManualPlace.name}
                </Text>
              )}

              {/* Time Picker Section */}
              <View style={styles.timePickerContainer}>
                <Text style={styles.manualInputLabel}>Check-in time</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.timePickerText}>
                    {formatTime(selectedTime)}
                  </Text>
                  <IconSymbol name="clock" size={20} color="#007AFF" />
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={onTimeChange}
                  />
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.manualCheckInButton,
                  (!selectedManualPlace || manualCheckInLoading) &&
                    styles.manualCheckInButtonDisabled,
                ]}
                onPress={handleManualCheckIn}
                disabled={!selectedManualPlace || manualCheckInLoading}
              >
                {manualCheckInLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.buttonText}>Check-in</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  const firstPlace = places[0];
  const alternativePlaces = places.slice(1);

  return (
    <View style={styles.container}>
      {!viewingAlternatives ? (
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mainContent}>
            <Text style={styles.questionText}>Are you at</Text>

            <View style={styles.placeCard}>
              <Image
                source={{
                  uri:
                    firstPlace.photos && firstPlace.photos.length > 0
                      ? `https://places.googleapis.com/v1/${firstPlace.photos[0]}/media?maxHeightPx=400&maxWidthPx=400&key=${placesApiKey || process.env.EXPO_PUBLIC_PLACES_API_KEY}`
                      : placeholderImage,
                }}
                style={styles.image}
                resizeMode="cover"
              />

              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{firstPlace.name}</Text>
                <Text style={styles.placeAddress}>{firstPlace.address}</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.greenButton}
                onPress={() => checkIn(firstPlace)}
              >
                <Text style={styles.buttonText}>Yes, check me in</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.redButton}
                onPress={() => setViewingAlternatives(true)}
              >
                <Text style={styles.buttonText}>No, show other places</Text>
              </TouchableOpacity>
            </View>

            {/* Manual Check-in Section */}
            <View style={styles.manualCheckInSection}>
              <Text style={styles.manualCheckInHeading}>Manual check-in</Text>

              <View style={styles.manualInputContainer}>
                <Text style={styles.manualInputLabel}>Search for places</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.manualTextInput}
                    value={manualPlaceName}
                    onChangeText={handleManualPlaceNameChange}
                    placeholder="Enter place name..."
                    placeholderTextColor="#999"
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                  />
                  {isLoadingSuggestions && (
                    <Text style={styles.searchingText}>Searching...</Text>
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
                            <Text style={styles.suggestionMainText}>
                              {item.structured_formatting.main_text}
                            </Text>
                            <Text style={styles.suggestionSecondaryText}>
                              {item.structured_formatting.secondary_text}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {selectedManualPlace && (
                  <Text style={styles.selectedPlaceText}>
                    Selected: {selectedManualPlace.name}
                  </Text>
                )}

                {/* Time Picker Section */}
                <View style={styles.timePickerContainer}>
                  <Text style={styles.manualInputLabel}>Check-in time</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.timePickerText}>
                      {formatTime(selectedTime)}
                    </Text>
                    <IconSymbol name="clock" size={20} color="#007AFF" />
                  </TouchableOpacity>

                  {showTimePicker && (
                    <DateTimePicker
                      value={selectedTime}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={onTimeChange}
                    />
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.manualCheckInButton,
                    (!selectedManualPlace || manualCheckInLoading) &&
                      styles.manualCheckInButtonDisabled,
                  ]}
                  onPress={handleManualCheckIn}
                  disabled={!selectedManualPlace || manualCheckInLoading}
                >
                  {manualCheckInLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Check-in</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={[styles.mainContent, {paddingBottom: 20}]}>
          <Text style={styles.questionText}>Select your location:</Text>

          <TouchableOpacity
            style={[styles.redButton, { marginBottom: 20 }]}
            onPress={() => setViewingAlternatives(false)}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
          <FlatList
            data={alternativePlaces}
            keyExtractor={(item) => item.name + item.address}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.alternativeCard}
                onPress={() => checkIn(item)}
              >
                <Image
                  source={{
                    uri:
                      item.photos && item.photos.length > 0
                        ? `https://places.googleapis.com/v1/${item.photos[0]}/media?maxHeightPx=400&maxWidthPx=400&key=${placesApiKey || process.env.EXPO_PUBLIC_PLACES_API_KEY}`
                        : placeholderImage,
                  }}
                  style={styles.alternativeImage}
                  resizeMode="cover"
                />

                <View style={styles.alternativeInfo}>
                  <Text style={styles.alternativeName}>{item.name}</Text>
                  <Text style={styles.alternativeAddress}>{item.address}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
    minWidth: 300,
  },
  mainContent: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 350,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  successCard: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  successText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 25,
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 30,
    minWidth: 300,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 25,
    textAlign: "center",
  },
  questionText: {
    textAlign: "center",
    marginBottom: 30,
    fontSize: 28,
    fontWeight: "bold",
  },
  placeCard: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: "100%",
    height: 200,
  },
  placeInfo: {
    padding: 20,
  },
  placeName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  placeAddress: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 40,
  },
  greenButton: {
    backgroundColor: "#34C759",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  redButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  blueButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  alternativeCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    padding: 12,
    alignItems: "center",
  },
  alternativeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  alternativeInfo: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  alternativeAddress: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  // Manual check-in styles
  manualCheckInSection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 300,
  },
  manualCheckInHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  manualInputContainer: {
    gap: 15,
  },
  manualInputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  inputWrapper: {
    position: "relative",
  },
  manualTextInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  searchingText: {
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
  selectedPlaceText: {
    fontSize: 12,
    color: "#007AFF",
    fontStyle: "italic",
    marginTop: -10,
  },
  // Time picker styles
  timePickerContainer: {
    marginTop: 5,
  },
  timePickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timePickerText: {
    fontSize: 16,
    color: "#333",
  },
  manualCheckInButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  manualCheckInButtonDisabled: {
    backgroundColor: "#aaa",
    shadowColor: "#aaa",
  },
});
