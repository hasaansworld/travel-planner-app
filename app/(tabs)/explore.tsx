import { Image } from "expo-image";
import React, { useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

// Mock data for locations
const mockLocation = {
  name: "Central Park",
  address: "59th to 110th St, 5th to 8th Ave, New York, NY 10022",
  photo:
    "https://images.unsplash.com/photo-1541522651281-4e5572e7ef3c?w=400&h=300&fit=crop",
};

const mockPlaces = [
  {
    id: "1",
    name: "Times Square",
    address: "Times Square, New York, NY 10036",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
  },
  {
    id: "2",
    name: "Brooklyn Bridge",
    address: "Brooklyn Bridge, New York, NY 10038",
    photo:
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=300&h=200&fit=crop",
  },
  {
    id: "3",
    name: "Statue of Liberty",
    address: "Liberty Island, New York, NY 10004",
    photo:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=300&h=200&fit=crop",
  },
  {
    id: "4",
    name: "Empire State Building",
    address: "350 5th Ave, New York, NY 10118",
    photo:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300&h=200&fit=crop",
  },
  {
    id: "5",
    name: "High Line",
    address: "High Line, New York, NY 10011",
    photo:
      "https://images.unsplash.com/photo-1571738525501-e2f6ce8089c0?w=300&h=200&fit=crop",
  },
];

export default function CheckInScreen() {
  const [showPlacesList, setShowPlacesList] = useState(false);

  const handleYesPress = () => {
    // Handle successful check-in
    alert("Successfully checked in at " + mockLocation.name + "!");
  };

  const handleNoPress = () => {
    setShowPlacesList(true);
  };

  const handlePlaceSelect = (place: (typeof mockPlaces)[0]) => {
    alert("Checked in at " + place.name + "!");
    setShowPlacesList(false);
  };

  const renderPlaceItem = ({ item }: { item: (typeof mockPlaces)[0] }) => (
    <TouchableOpacity
      style={styles.placeItem}
      onPress={() => handlePlaceSelect(item)}
    >
      <Image source={{ uri: item.photo }} style={styles.placeItemImage} />
      <ThemedView style={styles.placeItemInfo}>
        <ThemedText type="defaultSemiBold" style={styles.placeItemName}>
          {item.name}
        </ThemedText>
        <ThemedText style={styles.placeItemAddress}>{item.address}</ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  if (showPlacesList) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.heading}>
            Choose a place to check in
          </ThemedText>

          <FlatList
            data={mockPlaces}
            renderItem={renderPlaceItem}
            keyExtractor={(item) => item.id}
            style={styles.placesList}
            showsVerticalScrollIndicator={false}
          />
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.heading}>
          Are you here?
        </ThemedText>

        <ThemedView style={styles.locationContainer}>
          <ThemedView style={styles.locationInfo}>
            <Image
              source={{ uri: mockLocation.photo }}
              style={styles.locationImage}
            />
            <ThemedView style={styles.locationDetails}>
              <ThemedText type="subtitle" style={styles.locationName}>
                {mockLocation.name}
              </ThemedText>
              <ThemedText style={styles.locationAddress}>
                {mockLocation.address}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.buttonContainer}>
          <TouchableOpacity style={styles.yesButton} onPress={handleYesPress}>
            <ThemedText style={styles.yesButtonText}>Yes</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.noButton} onPress={handleNoPress}>
            <ThemedText style={styles.noButtonText}>No</ThemedText>
          </TouchableOpacity>
        </ThemedView>
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
  heading: {
    textAlign: "center",
    marginBottom: 30,
    fontSize: 28,
    fontWeight: "bold",
  },
  locationContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 15,
  },
  locationDetails: {
    flex: 1,
    justifyContent: "flex-start",
  },
  locationName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  locationAddress: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  yesButton: {
    flex: 1,
    backgroundColor: "#34C759",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  yesButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  noButton: {
    flex: 1,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  noButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  placesList: {
    flex: 1,
  },
  placeItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  placeItemInfo: {
    flex: 1,
  },
  placeItemName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  placeItemAddress: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
});
