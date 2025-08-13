import { apiKeyAtom, placesApiKeyAtom, userIdAtom } from '@/atoms/global';
import { planApi, userApi } from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtom } from 'jotai';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const placeholderImage =
  "https://hds.hel.fi/images/foundation/visual-assets/placeholders/image-m@3x.png";
const screenWidth = Dimensions.get("window").width;
const SETTINGS_KEY = "@user_settings";

export default function ShowPlanScreen() {
  const {
    lat,
    long,
    radius,
    rating,
    numberOfDays,
    startDate,
    message,
    plan_id,
  } = useLocalSearchParams<{
    lat: string;
    long: string;
    radius: string;
    rating: string;
    numberOfDays: string;
    startDate: string;
    message: string;
    plan_id: string;
  }>();

  const [userId] = useAtom(userIdAtom);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [selectedModel, setSelectedModel] = useState("llama");
  
  const [planData, setPlanData] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [planID, setPlanID] = useState(-1);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [planLocation, setPlanLocation] = useState<{lat: number, lon: number} | null>(null);
  const [apiKey,] = useAtom(apiKeyAtom);
  const [placesApiKey,] = useAtom(placesApiKeyAtom);

  const router = useRouter();

  // Check if we're viewing an existing plan or creating a new one
  const isViewingExistingPlan = !!plan_id;

  // Format distance from meters to readable format
  const formatDistance = (distanceInMeters: number) => {
    if (distanceInMeters >= 1000) {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    } else {
      return `${Math.round(distanceInMeters)}m`;
    }
  };

  // Handle place click
  const handlePlaceClick = (place: any) => {
    if (!place.location || !planLocation) {
      console.log("Missing location data for place or plan");
      return;
    }

    router.push({
      pathname: "/place-detail",
      params: {
        placeName: place.name,
        placeImage: place.photos && place.photos.length > 0 
          ? `https://places.googleapis.com/v1/${place.photos[0]}/media?maxHeightPx=400&maxWidthPx=400&key=${placesApiKey || process.env.EXPO_PUBLIC_PLACES_API_KEY}`
          : placeholderImage,
        placeLat: place.location.latitude.toString(),
        placeLon: place.location.longitude.toString(),
        planLat: planLocation.lat.toString(),
        planLon: planLocation.lon.toString(),
      },
    });
  };

  const fetchExistingPlan = async () => {
    try {
      setLoading(true);
      setSuccess(null);

      const json = await AsyncStorage.getItem(SETTINGS_KEY);
      if (json !== null) {
        const settings = JSON.parse(json);
        setSelectedModel(settings.model || "llama");
      }

      // Call the new endpoint to get plan by ID
      const response = await userApi.getPlanById({
        plan_id: parseInt(plan_id),
        user_id: userId,
      });

      const planDataArray = [];

      // Add original plan's parameters as first message
      const originalPlan = response.original_plan;
      
      // Store plan location for place navigation
      setPlanLocation({
        lat: originalPlan.lat,
        lon: originalPlan.lon
      });

      const originalRequest = `📍 Location: ${originalPlan.lat?.toFixed(4)}, ${originalPlan.lon?.toFixed(4)}
🔍 Search radius: ${originalPlan.radius_km}km
⭐ Minimum rating: ${originalPlan.rating}/5
📅 Duration: ${originalPlan.number_of_days} day${originalPlan.number_of_days > 1 ? 's' : ''}
📆 Start date: ${originalPlan.start_date ? new Date(originalPlan.start_date).toDateString() : 'Not set'}
🎯 Intent: ${originalPlan.intent}`;

      planDataArray.push({ type: "original_request", value: originalRequest });

      // Add original plan
      planDataArray.push({ type: "plan", value: response.original_plan });
      setPlanID(response.original_plan.travel_plan_id);

      // Add update plans with their intents as user messages
      response.update_plans.forEach((updatePlan: any) => {
        // Extract the update intent (everything after the last comma in intent)
        const intentParts = updatePlan.intent.split(', ');
        const updateIntent = intentParts[intentParts.length - 1];
        
        // Add user message for the update intent
        planDataArray.push({ type: "message", value: updateIntent });
        
        // Add the updated plan
        planDataArray.push({ type: "plan", value: updatePlan });
      });

      setPlanData(planDataArray);
      setSuccess(true);
    } catch (error) {
      console.error("Plan fetch error:", error);
      setPlanData([
        { type: "error", value: "Failed to load plan. Please try again.", action: "retry_plan" }
      ]);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlan = async () => {
    try {
      setLoading(true);
      setSuccess(null);

      // Store plan location for place navigation
      if (lat && long) {
        setPlanLocation({
          lat: parseFloat(lat),
          lon: parseFloat(long)
        });
      }

      // Add original parameters as first message if planData is empty
      if (planData.length === 0) {
        const originalRequest = `📍 Location: ${parseFloat(lat).toFixed(4)}, ${parseFloat(long).toFixed(4)}
🔍 Search radius: ${radius}km
⭐ Minimum rating: ${rating}/5
📅 Duration: ${numberOfDays} day${parseInt(numberOfDays) > 1 ? 's' : ''}
📆 Start date: ${startDate}
🎯 Intent: ${message}`;

        setPlanData([{ type: "original_request", value: originalRequest }]);
      }

      const json = await AsyncStorage.getItem(SETTINGS_KEY);
      if (json !== null) {
        const settings = JSON.parse(json);
        setSelectedModel(settings.model || "llama");
      }

      const response = await planApi.getPlan({
        lat: parseFloat(lat),
        lon: parseFloat(long),
        radius_km: parseInt(radius),
        rating: parseFloat(rating),
        number_of_days: parseInt(numberOfDays),
        start_date: startDate,
        intent: message,
        user_id: userId,
        city_id: 1,
        model: selectedModel,
        api_key: apiKey,
        places_api_key: placesApiKey,
      });

      setPlanData((prev) => [...prev, { type: "plan", value: response }]);
      setPlanID(response.travel_plan_id);

      setSuccess(true);
    } catch (error) {
      console.error("Plan API error:", error);
      setPlanData((prev) => [
        ...prev,
        { type: "error", value: "Failed to generate plan. Please try again.", action: "retry_plan" }
      ]);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      if (isViewingExistingPlan) {
        fetchExistingPlan();
      } else {
        fetchPlan();
      }
  }, [plan_id, lat, long, radius, rating, numberOfDays, startDate, message, selectedModel]);

  // Handle place name input change with debouncing
  const handleMessageSend = async() => {
    const newMessageValue = newMessage.trim();
    if (!newMessageValue) return;

    setPlanData((prev) => [...prev, { type: "message", value: newMessage }]);
    setNewMessage("");
    setLoadingUpdate(true);

    try {
      const response = await planApi.updatePlan({
        plan_id: planID,
        user_id: userId,
        message: newMessageValue,
        model: selectedModel,
        api_key: apiKey,
        places_api_key: placesApiKey,
      });

      setPlanData((prev) => [...prev, { type: "plan", value: response }]);
      setPlanID(response.travel_plan_id);
      setSuccess(true);
    } catch (error) {
      console.error("Update Plan API error:", error);
      setPlanData((prev) => [
        ...prev,
        { type: "error", value: "Failed to update plan. Please try again.", action: "retry_update", originalMessage: newMessageValue }
      ]);
      setSuccess(false);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleRetry = async (item: any) => {
    // Remove the error message from planData first
    setPlanData((prev) => prev.filter((planItem) => planItem !== item));
    
    if (item.action === "retry_plan") {
      if (isViewingExistingPlan) {
        await fetchExistingPlan();
      } else {
        await fetchPlan();
      }
    } else if (item.action === "retry_update") {
      // Re-add the original message and retry
      setNewMessage(item.originalMessage || "");
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Text
          key={i}
          style={{ color: i < Math.round(rating) ? "#FFA500" : "#ccc" }}
        >
          ★
        </Text>
      );
    }
    return (
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
        {stars}
        <Text style={{ marginLeft: 5 }}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              {isViewingExistingPlan ? "Loading your travel plan..." : "Generating your travel plan..."}
            </Text>
          </View>
        )}

        {planData?.length > 0 && (
          <View>
            {planData.map((item, index) => {
              if (item.type === "plan" && item.value?.travel_plan) {
                return (
                  <View key={index} style={styles.messageBox}>
                    {Object.entries(item.value.travel_plan).map(
                      ([dayKey, dayData]: any) => (
                        <View
                          key={`${index}-${dayKey}`}
                          style={{ marginBottom: 20 }}
                        >
                          <Text style={styles.dayTitle}>
                            {dayKey.replace("_", " ").toUpperCase()}
                          </Text>
                          <Text style={styles.overview}>
                            {dayData.overview.theme}
                          </Text>
                          {dayData.itinerary.map((place: any, idx: number) => (
                            <TouchableOpacity 
                              key={idx} 
                              style={styles.placeContainer}
                              onPress={() => handlePlaceClick(place)}
                              activeOpacity={0.7}
                            >
                              <Image
                                source={{
                                  uri:
                                    place.photos && place.photos.length > 0
                                      ? `https://places.googleapis.com/v1/${place.photos[0]}/media?maxHeightPx=400&maxWidthPx=400&key=${placesApiKey || process.env.EXPO_PUBLIC_PLACES_API_KEY}`
                                        : placeholderImage,
                                }}
                                style={styles.image}
                                resizeMode="cover"
                              />
                              <View style={{ flex: 1, marginLeft: 10 }}>
                                <View style={styles.placeHeader}>
                                  <Text style={styles.placeName}>
                                    {place.name}
                                  </Text>
                                  {place.distance !== null && place.distance !== undefined && (
                                    <View style={styles.distanceBadge}>
                                      <Text style={styles.distanceText}>
                                        {formatDistance(place.distance)}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.placeTime}>
                                  {place.duration}
                                </Text>
                                <Text style={styles.placeReason}>
                                  {place.reason}
                                </Text>
                                {place.rating && renderStars(place.rating)}
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )
                    )}
                  </View>
                );
              } else if (item.type === "message") {
                return (
                  <View
                    key={index}
                    style={styles.userMessage}
                  >
                    <Text style={{ color: "#fff" }}>{item.value}</Text>
                  </View>
                );
              } else if (item.type === "original_request") {
                return (
                  <View
                    key={index}
                    style={styles.userMessage}
                  >
                    <Text style={{ color: "#fff" }}>{item.value}</Text>
                  </View>
                );
              } else if (item.type === "error") {
                return (
                  <View
                    key={index}
                    style={styles.errorMessage}
                  >
                    <Text style={styles.errorText}>{item.value}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => handleRetry(item)}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              return null;
            })}
          </View>
        )}

        {loadingUpdate && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Updating your plan...</Text>
          </View>
        )}
      </ScrollView>

      {success && (
        <View style={styles.bottomInput}>
          <TextInput
            style={styles.input}
            placeholder="Send a message"
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={(text) => setNewMessage(text)}
          />
          <TouchableOpacity
            disabled={loadingUpdate || !newMessage.trim()}
            style={[
              styles.sendButton,
              (loadingUpdate || !newMessage.trim()) && styles.sendButtonDisabled,
            ]}
            onPress={handleMessageSend}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  heading: {
    textAlign: "center",
    marginBottom: 30,
    fontSize: 28,
    fontWeight: "bold",
  },
  messageBox: {
    backgroundColor: "#e0e0e0",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginTop: 10,
    width: screenWidth * 0.9,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  overview: {
    fontStyle: "italic",
    marginBottom: 15,
    color: "#555",
  },
  placeContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#ccc",
  },
  placeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  placeName: {
    fontWeight: "bold",
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  distanceBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 45,
    alignItems: "center",
  },
  distanceText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  placeTime: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#555",
  },
  placeReason: {
    color: "#555",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 15,
    marginBottom: 5,
    maxWidth: "80%",
    minHeight: 44,
  },
  errorMessage: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#f44336",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  bottomInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#aaa",
  },
});