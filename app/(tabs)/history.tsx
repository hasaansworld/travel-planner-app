import { userIdAtom } from "@/atoms/global";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { userApi } from "@/utils/api";
import { useFocusEffect, useRouter } from "expo-router";
import { useAtom } from "jotai";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";

interface UserPlan {
  travel_plan_id: number;
  city: string;
  country: string;
  intent: string;
  travel_date: string | null;
  number_of_days: number;
  rating: number;
  radius_km: number;
  created_at: string | null;
  model: string;
}

export default function PlansListScreen() {
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Hardcoded user ID for now - you can get this from your auth context
  const [userId] = useAtom(userIdAtom);

  const fetchPlans = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await userApi.getUserPlans(userId);
      setPlans(response.plans || []);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      setError("Failed to load your travel plans. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch plans when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [])
  );

  const onRefresh = () => {
    fetchPlans(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatCreatedDate = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return "Just now";
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else if (diffInHours < 24 * 7) {
        return `${Math.floor(diffInHours / 24)}d ago`;
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    } catch {
      return "";
    }
  };

  const handlePlanPress = (plan: UserPlan) => {
    // Navigate to show-plan screen with plan_id
    router.push({
      pathname: "/show-plan",
      params: {
        plan_id: plan.travel_plan_id.toString(),
      },
    });
  };

  const renderPlanItem = ({ item }: { item: UserPlan }) => (
    <TouchableOpacity style={styles.planItem} onPress={() => handlePlanPress(item)}>
      <View style={styles.planHeader}>
        <View style={styles.locationContainer}>
          <ThemedText style={styles.cityText}>
            {item.city}
          </ThemedText>
          <ThemedText style={styles.countryText}>
            {item.country}
          </ThemedText>
        </View>
        <View style={styles.dateContainer}>
          <ThemedText style={styles.createdText}>
            {formatCreatedDate(item.created_at)}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.intentText} numberOfLines={2}>
        {item.intent}
      </ThemedText>

      <View style={styles.planDetails}>
        <View style={styles.detailItem}>
          <ThemedText style={styles.detailLabel}>Travel Date</ThemedText>
          <ThemedText style={styles.detailValue}>
            {formatDate(item.travel_date)}
          </ThemedText>
        </View>
        <View style={styles.detailItem}>
          <ThemedText style={styles.detailLabel}>Duration</ThemedText>
          <ThemedText style={styles.detailValue}>
            {item.number_of_days} day{item.number_of_days !== 1 ? 's' : ''}
          </ThemedText>
        </View>
      </View>

      <View style={styles.planMeta}>
        <View style={styles.metaItem}>
          <ThemedText style={styles.metaText}>⭐ {item.rating}+</ThemedText>
        </View>
        <View style={styles.metaItem}>
          <ThemedText style={styles.metaText}>📍 {item.radius_km}km</ThemedText>
        </View>
        <View style={styles.metaItem}>
          <ThemedText style={styles.metaText}>🤖 {item.model}</ThemedText>
        </View>
      </View>

      <View style={styles.arrow}>
        <ThemedText style={styles.arrowText}>›</ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText style={styles.emptyTitle}>No Travel Plans Yet</ThemedText>
      <ThemedText style={styles.emptyMessage}>
        Create your first travel plan to see it here!
      </ThemedText>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push("/(tabs)/")}
      >
        <ThemedText style={styles.createButtonText}>Create Plan</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <ThemedText style={styles.errorTitle}>Oops! Something went wrong</ThemedText>
      <ThemedText style={styles.errorMessage}>{error}</ThemedText>
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchPlans()}>
        <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Loading your plans...</ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>My Travel Plans</ThemedText>
        <ThemedText style={styles.subtitle}>
          {plans.length} plan{plans.length !== 1 ? 's' : ''}
        </ThemedText>
      </View>

      {error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={plans}
          renderItem={renderPlanItem}
          keyExtractor={(item) => item.travel_plan_id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  planItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: "relative",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  locationContainer: {
    flex: 1,
  },
  cityText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  countryText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  dateContainer: {
    alignItems: "flex-end",
  },
  createdText: {
    fontSize: 12,
    color: "#999",
  },
  intentText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  planDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    marginTop: 2,
  },
  planMeta: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 16,
  },
  metaItem: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  arrow: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -10,
  },
  arrowText: {
    fontSize: 20,
    color: "#ccc",
    fontWeight: "300",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#d32f2f",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});