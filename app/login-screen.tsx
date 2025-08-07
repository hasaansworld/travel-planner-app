import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes
} from '@react-native-google-signin/google-signin';
import { useTheme } from "@react-navigation/native";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";


export default function LoginScreen({ onLoginSuccess }: any) {
  const { colors } = useTheme();

  const signIn = async () => {
    try {

      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_WEB_ID,
        scopes: ['profile', 'email'],
        offlineAccess: false,
      });
      
      await GoogleSignin.hasPlayServices();
      
      const response = await GoogleSignin.signIn();
      
      if (isSuccessResponse(response)) {
        const userInfo = response.data.user;
        onLoginSuccess(response.data.user);
      } else {
        console.log("Sign in was cancelled by user");
      }
    } catch (error) {
      let errorMessage = "❌ ERROR: ";
      
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            errorMessage += "Sign in already in progress";
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            errorMessage += "Google Play Services not available or outdated";
            break;
          case statusCodes.SIGN_IN_CANCELLED:
            errorMessage += "Sign in cancelled by user";
            break;
          case statusCodes.SIGN_IN_REQUIRED:
            errorMessage += "Sign in required";
            break;
          default:
            errorMessage += `Unknown error code: ${error.code}`;
        }
        errorMessage += `\nFull error: ${JSON.stringify(error, null, 2)}`;
      } else {
        const genericError = error as Error;
        errorMessage += `Non-Google error: ${genericError.message || String(error)}`;
      }
      
      console.error("Google Sign-In Error:", error);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
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
            onPress={signIn}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 20,
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
    paddingVertical: 8,
    borderColor: "#ddd",
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
  debugContainer: {
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
    maxHeight: 300,
  },
  debugHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  debugScroll: {
    maxHeight: 200,
  },
  debugText: {
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  termsText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});