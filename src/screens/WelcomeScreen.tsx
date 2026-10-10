import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { Dimensions, StatusBar, StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamilies } from '../hooks/useAppFonts';
import { useOnboardingStore } from '../store/web-store';
import { Colors } from '../themes/color';
import type { RootStackParamList } from '../types/navigation';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'WelcomeScreen'
>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BREAKPOINTS = {
  SMALL: 375,
  MEDIUM: 428,
} as const;

const isSmallDevice = SCREEN_WIDTH < BREAKPOINTS.SMALL;
const isMediumDevice =
  SCREEN_WIDTH >= BREAKPOINTS.SMALL && SCREEN_WIDTH < BREAKPOINTS.MEDIUM;

const SPACING = {
  horizontal: isSmallDevice ? 20 : 24,
  vertical: isSmallDevice ? 32 : 40,
  bottom: isSmallDevice ? 32 : 40,
};

const FONT_SIZES = {
  logo: isSmallDevice ? 100 : isMediumDevice ? 120 : 140,
  tagline: isSmallDevice ? 20 : 22,
  subtitle: isSmallDevice ? 14 : 16,
  button: isSmallDevice ? 15 : 16,
  signIn: isSmallDevice ? 13 : 14,
};

const BUTTON_HEIGHT = isSmallDevice ? 50 : 56;

const AnimatedRectButton = Animated.createAnimatedComponent(RectButton);

const WelcomeScreen = ({ navigation }: WelcomeScreenProps) => {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const bottomSlideY = useSharedValue(300);
  const bottomOpacity = useSharedValue(0);
  const completeWelcome = useOnboardingStore(state => state.completeWelcome);

  useEffect(() => {
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });
    logoOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.ease),
    });

    bottomSlideY.value = withDelay(
      200,
      withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      }),
    );
    bottomOpacity.value = withDelay(
      200,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      }),
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const bottomAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomSlideY.value }],
    opacity: bottomOpacity.value,
  }));

  const handleGetStarted = () => {
    completeWelcome();
    navigation.navigate('MainWebView');
  };

  const handleSignIn = () => {
    completeWelcome();
    navigation.navigate('MainWebView');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.PrimaryBackground}
      />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Animated.Text style={[styles.logo, logoAnimatedStyle]}>
            oLo
          </Animated.Text>
        </View>
      </View>

      <Animated.View style={[styles.bottomSection, bottomAnimatedStyle]}>
        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}>OLO – Optics. Lifestyle. Oasis.</Text>
          <Text style={styles.subtitle}>
            Start your journey toward better vision with{'\n'}AI-powered
            support.
          </Text>
        </View>

        <AnimatedRectButton
          style={styles.getStartedButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.getStartedText}>Let's Get Started</Text>
        </AnimatedRectButton>

        <View style={styles.signInContainer}>
          <Text style={styles.signInPrompt}>Already have an account? </Text>
          <RectButton onPress={handleSignIn}>
            <Text style={styles.signInLink}>Sign in</Text>
          </RectButton>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.SecondaryText,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.horizontal,
  },
  logoContainer: {
    alignSelf: 'center',
  },
  logo: {
    fontSize: FONT_SIZES.logo,
    fontFamily: FontFamilies.logo,
    color: Colors.PrimaryBackground,
    textAlign: 'center',
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: SPACING.bottom,
  },
  tagline: {
    fontSize: FONT_SIZES.tagline,
    marginBottom: 16,
    fontFamily: FontFamilies.bold,
    textAlign: 'center',
    color: Colors.PrimaryText,
  },
  subtitle: {
    fontSize: FONT_SIZES.subtitle,
    fontFamily: FontFamilies.regular,
    color: Colors.lightText,
    textAlign: 'center',
    lineHeight: FONT_SIZES.subtitle * 1.5,
  },
  bottomSection: {
    paddingHorizontal: SPACING.horizontal,
    paddingVertical: SPACING.vertical,
    backgroundColor: Colors.SecondaryBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  getStartedButton: {
    backgroundColor: Colors.SecondaryText,
    paddingVertical: (BUTTON_HEIGHT - FONT_SIZES.button) / 2,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedText: {
    color: Colors.SecondaryBackground,
    fontSize: FONT_SIZES.button,
    fontFamily: FontFamilies.bold,
    textAlign: 'center',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInPrompt: {
    fontSize: FONT_SIZES.signIn,
    fontFamily: FontFamilies.regular,
    color: Colors.lightText,
  },
  signInLink: {
    fontSize: FONT_SIZES.signIn,
    fontFamily: FontFamilies.bold,
    color: Colors.PrimaryText,
  },
});
