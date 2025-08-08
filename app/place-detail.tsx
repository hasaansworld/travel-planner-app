import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    Image,
    Linking,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

const { width, height } = Dimensions.get("window");

export default function PlaceDetailScreen() {
  const {
    placeName,
    placeImage,
    placeLat,
    placeLon,
    planLat,
    planLon,
  } = useLocalSearchParams<{
    placeName: string;
    placeImage: string;
    placeLat: string;
    placeLon: string;
    planLat: string;
    planLon: string;
  }>();

  const placeLocation = {
    latitude: parseFloat(placeLat),
    longitude: parseFloat(placeLon),
  };

  const planLocation = {
    latitude: parseFloat(planLat),
    longitude: parseFloat(planLon),
  };

  // Calculate region to show both markers
  const calculateRegion = (): Region => {
    const latDelta = Math.abs(placeLocation.latitude - planLocation.latitude) * 1.5 + 0.01;
    const lonDelta = Math.abs(placeLocation.longitude - planLocation.longitude) * 1.5 + 0.01;
    
    const centerLat = (placeLocation.latitude + planLocation.latitude) / 2;
    const centerLon = (placeLocation.longitude + planLocation.longitude) / 2;

    return {
      latitude: centerLat,
      longitude: centerLon,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lonDelta, 0.01),
    };
  };

  const [region, setRegion] = useState<Region>(calculateRegion());


  const openInGoogleMaps = () => {
    const lat = placeLocation.latitude;
    const lng = placeLocation.longitude;
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${lat},${lng}`;
    const label = encodeURIComponent(placeName);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        // Fallback to web Google Maps
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        Linking.openURL(webUrl);
      });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={false}
        mapType="standard"
        showsMyLocationButton={false}
      >
        {/* Plan Location Marker (Green Square) */}
        <Marker
          coordinate={planLocation}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.planMarker} />
        </Marker>

        <Marker
          coordinate={placeLocation}
          pinColor="red"
          title={placeName}
        />
      </MapView>

      {/* Bottom Card */}
      <ThemedView style={styles.bottomCard}>
        <View style={styles.placeInfo}>
          <Image
            source={{ uri: placeImage }}
            style={styles.placeImage}
            resizeMode="cover"
          />
          <View style={styles.placeDetails}>
            <ThemedText style={styles.placeTitle} numberOfLines={2}>
              {placeName}
            </ThemedText>
            <ThemedText style={styles.coordinates}>
              {placeLocation.latitude.toFixed(6)}, {placeLocation.longitude.toFixed(6)}
            </ThemedText>
          </View>
        </View>

        <TouchableOpacity style={styles.googleMapsButton} onPress={openInGoogleMaps}>
          <ThemedText style={styles.googleMapsButtonText}>
            Open in Google Maps
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  planMarker: {
    width: 24,
    height: 24,
    backgroundColor: "#34C759",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 160,
  },
  placeInfo: {
    flexDirection: "row",
    marginBottom: 20,
  },
  placeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  placeDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  placeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    lineHeight: 24,
  },
  coordinates: {
    fontSize: 14,
    color: "#666",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  googleMapsButton: {
    backgroundColor: "#4285F4",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  googleMapsButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});