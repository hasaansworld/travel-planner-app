import { ThemedText } from "@/components/ThemedText";
import { planApi } from "@/utils/api";
import { useLocalSearchParams } from "expo-router";
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

const placeholderImage = "https://via.placeholder.com/150";
const screenWidth = Dimensions.get("window").width;

export default function ShowPlanScreen() {
  const {
    lat,
    long,
    radius,
    rating,
    numberOfDays,
    startDate,
    message,
  } = useLocalSearchParams<{
    lat: string;
    long: string;
    radius: string;
    rating: string;
    numberOfDays: string;
    startDate: string;
    message: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [planData, setPlanData] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const[planID, setPlanID] = useState(-1);
    const[loadingUpdate, setLoadingUpdate] = useState(false);


  useEffect(() => {
    async function fetchPlan() {
      try {
        setLoading(true);
        setSuccess(null);

        const response = await planApi.getPlan({
          lat: parseFloat(lat),
          lon: parseFloat(long),
          radius_km: parseInt(radius),
          rating: parseFloat(rating),
          number_of_days: parseInt(numberOfDays),
          start_date: startDate,
          intent: message,
          user_id: 1,
          city_id: 1,
          model: "llama",
        });

        setPlanData((prev) => [...prev, { type: "plan", value: response }]);
        setPlanID(response.travel_plan_id);

        setSuccess(true);
      } catch (error) {
        console.error("Plan API error:", error);
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    }

    fetchPlan();
  }, [lat, long, radius, rating, numberOfDays, startDate, message]);

  // Handle place name input change with debouncing
  const handleMessageSend = async() => {
        const newMessageValue = newMessage.trim();
        setPlanData((prev) => [...prev, { type: "message", value: newMessage }]);
        setNewMessage("");
        setLoadingUpdate(true);

        try {
          const response = await planApi.updatePlan({
            plan_id: planID,
            user_id: 1,
            message: newMessageValue,
            model: "llama",
          });

          setPlanData((prev) => [...prev, { type: "plan", value: response }]);

          setSuccess(true);
        } catch (error) {
          console.error("Update Plan API error:", error);
          setSuccess(false);
        } finally {
          setLoadingUpdate(false);
        }
  }

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
        {loading && <ActivityIndicator size="large" color="#007AFF" />}
        {!loading && success === false && (
          <ThemedText style={{ color: "red", fontSize: 18 }}>
            Failed to load plan.
          </ThemedText>
        )}

        {!loading && success && planData?.length > 0 && (
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
                            <View key={idx} style={styles.placeContainer}>
                              <Image
                                source={{
                                  uri:
                                    place.photos && place.photos.length > 0
                                      ? `https://places.googleapis.com/v1/${place.photos[0]}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
                                        : placeholderImage,
                                }}
                                style={styles.image}
                                resizeMode="cover"
                              />
                              <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.placeName}>
                                  {place.name}
                                </Text>
                                <Text style={styles.placeTime}>
                                  {place.duration}
                                </Text>
                                <Text style={styles.placeReason}>
                                  {place.reason}
                                </Text>
                                {place.rating && renderStars(place.rating)}
                              </View>
                            </View>
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
                    style={{
                      alignSelf: "flex-end",
                      backgroundColor: "#007AFF",
                      padding: 10,
                      borderRadius: 15,
                      marginBottom: 5,
                      maxWidth: "80%",
                    }}
                  >
                    <Text style={{ color: "#fff" }}>{item.value}</Text>
                  </View>
                );
              }
              return null;
            })}
          </View>
        )}

        {loadingUpdate && <ActivityIndicator size="large" color="#007AFF" />}
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
            disabled={loadingUpdate}
            style={[
              styles.sendButton,
              loadingUpdate && styles.sendButtonDisabled,
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
    width: screenWidth * 0.7,
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
  placeName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  placeTime: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#555",
  },
  placeReason: {
    color: "#555",
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
