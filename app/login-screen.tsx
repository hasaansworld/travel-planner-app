import { useTheme } from "@react-navigation/native";
import React from "react";
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function LoginScreen({ onLoginSuccess }: any) {
  const { colors } = useTheme();

  const handleGoogleLogin = () => {
    // Here you would implement actual Google OAuth
    // For now, we'll just simulate a successful login
    console.log("Login with Google pressed");

    // Simulate API call delay
    setTimeout(() => {
      onLoginSuccess();
    }, 1000);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        {/* Logo/App Name Section */}
        <View style={styles.logoSection}>
          <Text style={[styles.appName, { color: colors.text }]}>
            Travel Planner
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Welcome! Please sign in to continue
          </Text>
        </View>

        {/* Login Button Section */}
        <View style={styles.loginSection}>
          <TouchableOpacity
            style={[styles.googleButton, { borderColor: colors.border }]}
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
          >
            <View style={styles.googleButtonContent}>
              {/* Google Icon Placeholder */}
              <View style={styles.googleIcon}>
                <Image
                  source={require("../assets/images/google.png")}
                  style={styles.googleIconImage}
                />
              </View>
              <Text style={[styles.googleButtonText, { color: colors.text }]}>
                Continue with Google
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.termsText, { color: colors.text }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 80,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 22,
  },
  loginSection: {
    alignItems: "center",
  },
  googleButton: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  googleIconImage: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  termsText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
