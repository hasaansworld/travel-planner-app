import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function SettingsScreen() {
  const [selectedModel, setSelectedModel] = useState("gpt-4.1");
  const [apiKey, setApiKey] = useState("");
  const [backgroundTracking, setBackgroundTracking] = useState(false);

  const handleSave = () => {
    // Save logic here
    console.log("Model:", selectedModel);
    console.log("API Key:", apiKey);
    console.log("Background tracking:", backgroundTracking);
  };

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
            onValueChange={(itemValue) => setSelectedModel(itemValue)}
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
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Enter your API key"
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
