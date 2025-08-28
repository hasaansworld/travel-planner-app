# Travel Planner App

A React Native mobile application built with Expo that helps users plan personalized travel itineraries with AI-powered recommendations, location-based services, and automatic check-ins.

## Features

- **AI-Powered Travel Planning**: Generate personalized travel plans using different AI models (LLaMA, etc.)
- **Location-Based Services**: Automatic check-ins to nearby places using background location tracking
- **Interactive Maps**: Integration with Google Maps for place selection and navigation
- **Real-time Plan Updates**: Modify and refine travel plans with natural language requests
- **Place Discovery**: Explore nearby attractions with ratings, photos, and detailed information
- **Background Location Tracking**: Automatic location updates even when the app is closed
- **Cross-Platform**: Supports iOS, Android, and Web

## Tech Stack

- **Framework**: React Native with Expo (SDK 53)
- **Navigation**: Expo Router with typed routes
- **State Management**: Jotai for atomic state management
- **Location Services**: Expo Location with background tracking
- **Maps**: React Native Maps with Google Maps integration
- **Authentication**: Google Sign-In
- **Storage**: AsyncStorage for local data persistence
- **TypeScript**: Full TypeScript support

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- For iOS development: Xcode and iOS Simulator
- For Android development: Android Studio and Android Emulator

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Backend API
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com

# Google Maps API Key (for maps and places)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Google Places API Key (for place photos and details)
EXPO_PUBLIC_PLACES_API_KEY=your_google_places_api_key

# Google OAuth Web Client ID (for authentication)
EXPO_PUBLIC_WEB_ID=your_google_oauth_web_client_id
```

### Getting API Keys

1. **Google Maps API Key**: 
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps SDK for Android, Maps SDK for iOS, and Places API
   - Create credentials and get your API key

2. **Google Places API Key**:
   - Same as above, ensure Places API is enabled
   - Can use the same key or create a separate one

3. **Google OAuth Web Client ID**:
   - In Google Cloud Console, go to APIs & Credentials
   - Create OAuth 2.0 Client ID for Web application
   - Use the client ID from the web application

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd travel-planner-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env` (if available)
   - Fill in your API keys and backend URL

4. **Configure Google Services**:
   - Place your `google-services.json` (Android) in the root directory
   - This file is required for Google Sign-In and Firebase services

## Development

### Start the development server:
```bash
npm start
```

### Platform-specific commands:
```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web browser
npm run web
```

### Code quality:
```bash
# Run linting
npm run lint
```

## Building

### Development Build:
```bash
# Install EAS CLI
npm install -g eas-cli

# Create development build
eas build --profile development --platform all
```

### Preview Build:
```bash
eas build --profile preview --platform all
```

### Production Build:
```bash
eas build --profile production --platform all
```

## Project Structure

```
travel-planner-app/
├── app/                    # App screens and routing
│   ├── (tabs)/            # Tab-based navigation screens
│   │   ├── index.tsx      # Home/Search screen
│   │   ├── check-in.tsx   # Check-in screen
│   │   ├── history.tsx    # Travel history
│   │   └── settings.tsx   # App settings
│   ├── login-screen.tsx   # Authentication screen
│   ├── map-selection.tsx  # Location selection with map
│   ├── place-detail.tsx   # Individual place details
│   └── show-plan.tsx      # Travel plan display
├── atoms/                 # Jotai state atoms
│   └── global.ts         # Global app state
├── components/           # Reusable UI components
├── constants/           # App constants and themes
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
│   ├── api.ts         # API client and endpoints
│   └── backgroundLocationService.ts # Background location tracking
├── assets/            # Images, fonts, and static assets
└── app.config.js     # Expo configuration
```

## Key Components

### State Management (Jotai Atoms)
- `userIdAtom`: Current user ID
- `apiKeyAtom`: AI API key for plan generation
- `placesApiKeyAtom`: Google Places API key

### API Integration
- Backend API for travel plan generation and user management
- Google Places API for location data and photos
- Google Maps API for map functionality

### Background Services
- Location tracking service for automatic check-ins
- Background fetch for periodic location updates
- Foreground service for continuous location monitoring

## Permissions

### iOS
- Location (always and when in use)
- Background location updates
- Background app refresh

### Android
- ACCESS_FINE_LOCATION
- ACCESS_COARSE_LOCATION
- ACCESS_BACKGROUND_LOCATION
- FOREGROUND_SERVICE
- FOREGROUND_SERVICE_LOCATION
- WAKE_LOCK

## Deployment

The app uses EAS (Expo Application Services) for building and deployment:

1. **Configure EAS**:
   ```bash
   eas login
   eas build:configure
   ```

2. **Build for stores**:
   ```bash
   # iOS App Store
   eas build --platform ios --profile production

   # Google Play Store
   eas build --platform android --profile production
   ```

3. **Submit to stores**:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Common Issues

1. **Location permissions not working**:
   - Ensure all location permissions are granted in device settings
   - Check that background location is enabled for the app

2. **Google Sign-In failing**:
   - Verify `google-services.json` is in the root directory
   - Check that the OAuth Web Client ID is correct
   - Ensure SHA-1 fingerprints are added to Firebase console

3. **Maps not loading**:
   - Verify Google Maps API key is valid and has proper restrictions
   - Check that Maps SDK is enabled for your platform

4. **Build errors**:
   - Clear metro cache: `npx expo start --clear`
   - Reset project: `npm run reset-project`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

## Support

For support and questions, please open an issue in the GitHub repository or contact the development team.
