import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a5f7a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#f5f5f5',
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Dashboard', headerShown: false }} />
        <Stack.Screen name="scan" options={{ title: 'Scan Record' }} />
        <Stack.Screen name="review" options={{ title: 'Review & Save' }} />
        <Stack.Screen name="patients/index" options={{ title: 'Patients' }} />
        <Stack.Screen name="patients/[id]" options={{ title: 'Patient Details' }} />
        <Stack.Screen name="patients/new" options={{ title: 'New Patient' }} />
        <Stack.Screen name="visits/index" options={{ title: 'Visits' }} />
        <Stack.Screen name="visits/[id]" options={{ title: 'Visit Details' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
