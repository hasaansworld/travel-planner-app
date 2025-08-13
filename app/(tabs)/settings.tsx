import { apiKeyAtom, placesApiKeyAtom } from '@/atoms/global';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useAtom } from 'jotai';
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const SETTINGS_KEY = "@user_settings";

export default function SettingsScreen() {
  const [selectedModel, setSelectedModel] = useState("llama");
  const [, setApiKey] = useAtom(apiKeyAtom);
  const [, setPlacesApiKeyAtom] = useAtom(placesApiKeyAtom);
  const [localApiKey, setLocalApiKey] = useState("");
  const [placesApiKey, setPlacesApiKey] = useState("");
  const [backgroundTracking, setBackgroundTracking] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const json = await AsyncStorage.getItem(SETTINGS_KEY);
        if (json !== null) {
          const settings = JSON.parse(json);
          setSelectedModel(settings.model || "llama");
          setLocalApiKey(settings.apiKey || "");
          setPlacesApiKey(settings.placesApiKey || "");
          setBackgroundTracking(settings.backgroundTracking || false);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    const settings = {
      model: selectedModel,
      apiKey: localApiKey.trim(),
      placesApiKey: placesApiKey.trim(),
      backgroundTracking,
    };

    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      
      // Update Jotai atoms
      setApiKey(localApiKey.trim());
      setPlacesApiKeyAtom(placesApiKey.trim());
      
      Alert.alert("Success", "Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings.");
    }
  };

  if (!isLoaded) return null; // Avoid flashing default values before load

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedText type="title" style={styles.title}>
        Settings
      </ThemedText>

      {/* Model Picker */}
      <ThemedView style={styles.inputContainer}>
        <ThemedText type="subtitle" style={styles.label}>
          Model
        </ThemedText>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedModel}
            onValueChange={setSelectedModel}
            style={styles.picker}
            dropdownIconColor="#333"
          >
            <Picker.Item label="llama" value="llama" />
            <Picker.Item label="deepseek" value="deepseek" />
            <Picker.Item label="gpt-4.1" value="gpt-4.1" />
          </Picker>
        </View>
      </ThemedView>

      {/* API Key Input */}
      <ThemedView style={styles.inputContainer}>
        <ThemedText type="subtitle" style={styles.label}>
          API Key
        </ThemedText>
        <TextInput
          style={styles.textInput}
          value={localApiKey}
          onChangeText={setLocalApiKey}
          placeholder="Enter your API key"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />
      </ThemedView>

      {/* Places API Key Input */}
      <ThemedView style={styles.inputContainer}>
        <ThemedText type="subtitle" style={styles.label}>
          Places API Key
        </ThemedText>
        <TextInput
          style={styles.textInput}
          value={placesApiKey}
          onChangeText={setPlacesApiKey}
          placeholder="Enter your Places API key"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />
      </ThemedView>

      {/* Background Tracking Switch */}
      <ThemedView style={styles.inputContainer}>
        <ThemedText type="subtitle" style={styles.label}>
          Background Location Tracking
        </ThemedText>
        <View style={styles.switchRow}>
          <Switch
            value={backgroundTracking}
            onValueChange={setBackgroundTracking}
            trackColor={{ true: "#007AFF", false: "#ccc" }}
            thumbColor={backgroundTracking ? "#fff" : "#f4f3f4"}
          />
        </View>
      </ThemedView>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <ThemedText style={styles.saveButtonText}>Save</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  picker: {
    width: "100%",
    color: "#333",
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
