import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Brand } from '@/constants/brand';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ProductsProvider } from '@/context/ProductsContext';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Brand.orange,
    background: Brand.bg,
    card: Brand.white,
    text: Brand.ink,
    border: Brand.border,
    notification: Brand.orange,
  },
};

/** Hides the native splash screen once the session has been restored. */
function SplashController({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loading]);
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SplashController>
          <ProductsProvider>
            <CartProvider>
              <ThemeProvider value={theme}>
                <StatusBar style="dark" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: Brand.bg },
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="product/[id]" />
                  <Stack.Screen name="checkout" />
                  <Stack.Screen name="auth-callback" />
                </Stack>
              </ThemeProvider>
            </CartProvider>
          </ProductsProvider>
        </SplashController>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
