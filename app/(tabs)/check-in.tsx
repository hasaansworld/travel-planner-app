import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { placesApi } from "../../utils/api"; // adjust import as needed

const placeholderImage =
  "https://hds.hel.fi/images/foundation/visual-assets/placeholders/image-m@3x.png";

export default function CheckInScreen() {
  const [location, setLocation] = useState<{
    lat: number;
    long: number;
  } | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [viewingAlternatives, setViewingAlternatives] = useState(false);

  const userId = 125001; // Replace with dynamic user ID if needed

  const fetchLocationAndPlaces = async () => {
    setLoading(true);
    setCheckInSuccess(false);
    setViewingAlternatives(false);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }

      // const userLocation = await Location.getCurrentPositionAsync({});
      // const lat = userLocation.coords.latitude;
      // const long = userLocation.coords.longitude;
      const lat = 65.0593; // Example latitude
      const long = 25.4663; // Example longitude
      setLocation({ lat, long });

      const res = await placesApi.getNearbyPlaces({ lat, long });
      setPlaces(res.places || []);
      places.forEach((place) => {
        console.log("Photos for place:", place.name, place.photos);
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch location or places.");
    } finally {
      setLoading(false);
    }
  };

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
      });
      setCheckInSuccess(true);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Check-in failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationAndPlaces();
  }, []);

  if (loading) {
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
          <Text style={styles.successIcon}>✅</Text>
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
      </View>
    );
  }

  const firstPlace = places[0];
  const alternativePlaces = places.slice(1);

  return (
    <View style={styles.container}>
      {!viewingAlternatives ? (
        <View style={styles.mainContent}>
          <Text style={styles.questionText}>Are you at</Text>

          <View style={styles.placeCard}>
            <Image
              source={{
                uri:
                  firstPlace.photos && firstPlace.photos.length > 0
                    ? `https://places.googleapis.com/v1/${firstPlace.photos[0]}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
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
        </View>
      ) : (
        <View style={styles.mainContent}>
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
                        ? `https://places.googleapis.com/v1/${item.photos[0]}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
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
  },
  mainContent: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
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
});
