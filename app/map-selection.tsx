import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import * as Location from "expo-location";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";


interface LocationCoords {
  latitude: number;
  longitude: number;
}

const { width, height } = Dimensions.get("window");

export default function MapSelectionScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { initialLat, initialLng, returnScreen } = useLocalSearchParams<{
    initialLat: string;
    initialLng: string;
    returnScreen: string;
  }>();

  const initialLocation = {
    latitude: parseFloat(initialLat),
    longitude: parseFloat(initialLng),
  };

  const [region, setRegion] = useState<Region>({
    latitude: initialLocation.latitude,
    longitude: initialLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState<LocationCoords>(
    initialLocation
  );
  const [locationName, setLocationName] = useState<string>("");
  const [isLoadingLocationName, setIsLoadingLocationName] = useState(false);

  // Function to get location name from coordinates using reverse geocoding
  const getLocationName = async (coords: LocationCoords) => {
    try {
      setIsLoadingLocationName(true);
      const [result] = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (result) {
        // Build a readable location name
        const parts = [];
        if (result.name) parts.push(result.name);
        if (result.street) parts.push(result.street);
        if (result.city) parts.push(result.city);
        if (result.region) parts.push(result.region);
        if (result.country) parts.push(result.country);

        const name = parts.length > 0 ? parts.slice(0, 3).join(", ") : "";
        setLocationName(name);
        return name;
      }
    } catch (error) {
      console.warn("Error getting location name:", error);
    } finally {
      setIsLoadingLocationName(false);
    }
    return "";
  };

  // Get location name when component mounts
  useEffect(() => {
    getLocationName(selectedLocation);
  }, []);

  // Handle map region change (when user pans/zooms)
  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
    const newLocation = {
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    };
    setSelectedLocation(newLocation);

    // Debounce the location name lookup to avoid too many API calls
    const timeoutId = setTimeout(() => {
      getLocationName(newLocation);
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  // Handle confirm location button press
  const handleConfirmLocation = () => {
    const locationData = {
      coords: selectedLocation,
      name: locationName,
    };

    // Navigate back to the original screen with the selected location
    navigation.goBack();
  };

  // Handle cancel button press
  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={true}
        showsMyLocationButton={true}
        mapType="standard"
      >
        <Marker
          coordinate={selectedLocation}
          title="Selected Location"
          description={locationName || "Tap confirm to select this location"}
        />
      </MapView>

      {/* Fixed center crosshair */}
      <View style={styles.crosshair}>
        <View style={styles.crosshairHorizontal} />
        <View style={styles.crosshairVertical} />
      </View>

      {/* Bottom panel with location info and buttons */}
      <ThemedView style={styles.bottomPanel}>
        <View style={styles.locationInfo}>
          <ThemedText style={styles.locationTitle}>
            Selected Location
          </ThemedText>
          <ThemedText style={styles.locationName}>
            {isLoadingLocationName
              ? "Loading location name..."
              : locationName || "Unknown location"}
          </ThemedText>
          <ThemedText style={styles.coordinates}>
            {selectedLocation.latitude.toFixed(6)},{" "}
            {selectedLocation.longitude.toFixed(6)}
          </ThemedText>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmLocation}
          >
            <ThemedText style={styles.confirmButtonText}>
              Confirm Location
            </ThemedText>
          </TouchableOpacity>
        </View>
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
  crosshair: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 20,
    height: 20,
    marginTop: -10,
    marginLeft: -10,
    justifyContent: "center",
    alignItems: "center",
  },
  crosshairHorizontal: {
    position: "absolute",
    width: 20,
    height: 2,
    backgroundColor: "#FF3B30",
  },
  crosshairVertical: {
    position: "absolute",
    width: 2,
    height: 20,
    backgroundColor: "#FF3B30",
  },
  bottomPanel: {
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
  },
  locationInfo: {
    marginBottom: 20,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#8E8E93",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 2,
    backgroundColor: "#34C759",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
