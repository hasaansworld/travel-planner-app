import React from "react";
import {
    ScrollView,
    StyleSheet,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useLocalSearchParams } from "expo-router";


export default function ShowPlanScreen() {

  const { lat, long, radius, rating, numberOfDays, startDate, message } = useLocalSearchParams();

  console.log("Received params:", {
    lat,
    long,
    radius,
    rating,
    numberOfDays,
    startDate,
    message,
  });
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ThemedText type="title" style={styles.heading}>
        Plan goes here
      </ThemedText>

      
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
    paddingBottom: 40, // Added padding for better spacing
  },
  heading: {
    textAlign: "center",
    marginBottom: 30,
    fontSize: 28,
    fontWeight: "bold",
  },
});
