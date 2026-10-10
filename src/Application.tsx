import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type React from 'react';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, AppState, LogBox, View, type AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import { ErrorBoundary } from './components/ui/ErrorBoundary/ErrorBoundary';
import { useAppFonts } from './hooks/useAppFonts';
import { MainWebView } from './screens/MainWebView';
import OnboardingScreen from './screens/OnboardingScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import { asyncStoragePersister, queryClient } from './store/queryClient';
import { useOnboardingStore } from './store/web-store';
import { Colors } from './themes/color';
import type { RootStackParamList } from './types/navigation';

enableScreens(true);

if (__DEV__) {
  LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
    'MediaPipe initialization warning',
    'OpenCV native module warning',
    'TensorFlow Lite model loading',
    'AR engine initialization',
    'Socket.IO connection warning',
    'Lottie animation warning',
  ]);
}

const AppNavigationTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.SecondaryText,
    background: Colors.PrimaryBackground,
    card: Colors.SecondaryBackground,
    text: Colors.PrimaryText,
    border: Colors.lightText,
    notification: Colors.logoColor,
  },
};
const Stack = createNativeStackNavigator<RootStackParamList>();

const Application: React.FC = () => {
  const { fontsLoaded, fontError } = useAppFonts();
  const hasCompletedOnboarding = useOnboardingStore(state => state.hasCompletedOnboarding);
  const hasSeenWelcome = useOnboardingStore(state => state.hasSeenWelcome);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        queryClient.resumePausedMutations();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription?.remove();
  }, []);

  const initialRouteName = useMemo((): keyof RootStackParamList => {
    const route = !hasCompletedOnboarding
      ? 'OnboardingScreen'
      : !hasSeenWelcome
        ? 'WelcomeScreen'
        : 'MainWebView';
    return route;
  }, [hasCompletedOnboarding, hasSeenWelcome]);

  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.SecondaryBackground,
        }}
      >
        <ActivityIndicator size="large" color={Colors.SecondaryText} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.SecondaryBackground }}>
        <SafeAreaProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: asyncStoragePersister,
              maxAge: 1000 * 60 * 60 * 24,
            }}
            onSuccess={() => {
              queryClient.resumePausedMutations();
            }}
          >
            <NavigationContainer theme={AppNavigationTheme}>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  animation: 'fade_from_bottom',
                  animationDuration: 350,
                  contentStyle: {
                    backgroundColor: Colors.PrimaryBackground,
                  },
                  presentation: 'card',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                  fullScreenGestureEnabled: true,
                }}
                initialRouteName={initialRouteName}
              >
                <Stack.Screen
                  name="OnboardingScreen"
                  component={OnboardingScreen}
                  options={{
                    animation: 'fade',
                    animationDuration: 400,
                    contentStyle: {
                      backgroundColor: Colors.SecondaryBackground,
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    },
                  }}
                />
                <Stack.Screen
                  name="WelcomeScreen"
                  component={WelcomeScreen}
                  options={{
                    animation: 'slide_from_right',
                    animationDuration: 350,
                  }}
                />
                <Stack.Screen
                  name="MainWebView"
                  component={MainWebView}
                  options={{
                    gestureEnabled: false,
                    animation: 'fade_from_bottom',
                    animationDuration: 400,
                  }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </PersistQueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default Application;