'use client';

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true });

export const useAppFonts = () => {
  const [fontsLoaded, fontError] = useFonts({
    'SF-Pro-Display-Bold': require('../../assets/fonts/SFPRODISPLAYBOLD.OTF'),
    'SF-Pro-Display-Regular': require('../../assets/fonts/SFPRODISPLAYREGULAR.OTF'),
    'SF-Pro-Display-Medium': require('../../assets/fonts/SFPRODISPLAYMEDIUM.OTF'),
    'Secular-One': require('../../assets/fonts/SecularOne-Regular.ttf'),
  });

  useEffect(() => {
    const hideSplash = async () => {
      if (fontsLoaded || fontError) {
        try {
          SplashScreen.hide();
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn('Error hiding splash screen:', e);
        }
      }
    };

    hideSplash();
  }, [fontsLoaded, fontError]);

  return {
    fontsLoaded,
    fontError,
  };
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const FontFamilies = {
  regular: 'SF-Pro-Display-Regular',
  medium: 'SF-Pro-Display-Medium',
  bold: 'SF-Pro-Display-Bold',
  logo: 'Secular-One',
} as const;
