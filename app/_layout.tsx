import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { CardWiseProvider, useCardWise } from '@/providers/CardWiseProvider';
import Colors from '@/constants/colors';
import 'expo-insights';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoading } = useCardWise();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!isLoading && Platform.OS !== 'web') {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (inOnboarding) {
      router.replace('/(tabs)/(home)');
    }
  }, [isLoading, segments, navigationState?.key]);

  if (isLoading) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerBackTitle: 'Back',
          contentStyle: { backgroundColor: Colors.dark.background },
        }}
      >
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen
          name="results"
          options={{
            headerShown: true,
            headerBackTitle: 'Back',
            title: '',
            headerStyle: { backgroundColor: Colors.dark.background },
            headerTintColor: Colors.dark.text,
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
        <CardWiseProvider>
          <RootLayoutNav />
        </CardWiseProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
