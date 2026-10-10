import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight } from 'lucide-react-native';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import type { ListRenderItem, ViewToken } from 'react-native';
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onboardingData } from '../data/index';
import { FontFamilies } from '../hooks/useAppFonts';
import { useOnboardingStore } from '../store/web-store';
import { Colors } from '../themes/color';
import type { RootStackParamList } from '../types/navigation';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OnboardingScreen'
>;

interface OnboardingScreenProps {
  navigation: OnboardingScreenNavigationProp;
}

interface OnboardingItem {
  id: number;
  title: string;
  description: string;
  image: number;
}

interface PaginationDotProps {
  index: number;
  scrollX: SharedValue<number>;
}

interface PaginationProps {
  scrollX: SharedValue<number>;
  dataLength: number;
}

interface OnboardingSlideProps {
  item: OnboardingItem;
}

interface ViewableItemsChangedInfo {
  viewableItems: ViewToken[];
  changed: ViewToken[];
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
  header: {
    horizontal: isSmallDevice ? 12 : isMediumDevice ? 16 : 20,
    vertical: isSmallDevice ? 8 : isMediumDevice ? 10 : 12,
  },
  footer: {
    horizontal: isSmallDevice ? 20 : 24,
    vertical: isSmallDevice ? 16 : 20,
  },
  text: {
    horizontal: isSmallDevice ? 20 : 24,
    vertical: isSmallDevice ? 32 : isMediumDevice ? 36 : 40,
    gap: isSmallDevice ? 12 : 16,
  },
} as const;

const FONT_SIZES = {
  skip: isSmallDevice ? 14 : 16,
  title: isSmallDevice ? 26 : isMediumDevice ? 28 : 30,
  description: isSmallDevice ? 14 : 16,
} as const;

const SIZES = {
  skipButton: {
    horizontal: isSmallDevice ? 16 : 20,
    vertical: isSmallDevice ? 8 : 10,
  },
  textWrapper: isSmallDevice ? 180 : isMediumDevice ? 190 : 200,
  textContainer: isSmallDevice ? 200 : isMediumDevice ? 210 : 220,
  borderRadius: isSmallDevice ? 20 : isMediumDevice ? 24 : 26,
  nextButton: isSmallDevice ? 52 : 56,
  icon: isSmallDevice ? 22 : 24,
} as const;

const LINE_HEIGHTS = {
  title: FONT_SIZES.title + 2,
  description: FONT_SIZES.description * 1.5,
} as const;

const OnboardingSlide = memo<OnboardingSlideProps>(({ item }) => {
  return (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.textWrapper}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>
        </View>
      </View>
    </View>
  );
});

OnboardingSlide.displayName = 'OnboardingSlide';

const PaginationDot = memo<PaginationDotProps>(({ index, scrollX }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP,
    );

    return { width, opacity };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
});

PaginationDot.displayName = 'PaginationDot';

const Pagination = memo<PaginationProps>(({ scrollX, dataLength }) => {
  const dots = useMemo(
    () =>
      Array.from({ length: dataLength }, (_, index) => (
        <PaginationDot key={index} index={index} scrollX={scrollX} />
      )),
    [dataLength, scrollX],
  );

  return <View style={styles.paginationContainer}>{dots}</View>;
});

Pagination.displayName = 'Pagination';

const OnboardingScreen = ({ navigation }: OnboardingScreenProps) => {
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList<OnboardingItem>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const completeOnboarding = useOnboardingStore(
    state => state.completeOnboarding,
  );

  const data = useMemo(() => onboardingData as OnboardingItem[], []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleNext = useCallback(() => {
    if (currentIndex < data.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      completeOnboarding();
      navigation.navigate('WelcomeScreen');
    }
  }, [currentIndex, data.length, navigation, completeOnboarding]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
    navigation.navigate('WelcomeScreen');
  }, [navigation, completeOnboarding]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: ViewableItemsChangedInfo) => {
      if (viewableItems.length > 0 && viewableItems[0]?.index !== null) {
        setCurrentIndex(viewableItems[0].index ?? 0);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem: ListRenderItem<OnboardingItem> = useCallback(
    ({ item }) => <OnboardingSlide item={item} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: OnboardingItem) => item.id.toString(),
    [],
  );

  const getItemLayout = useCallback(
    (_data: OnboardingItem[] | null | undefined, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.PrimaryBackground}
      />

      <View style={styles.header}>
        <RectButton style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </RectButton>
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        bounces={false}
        overScrollMode="never"
        alwaysBounceHorizontal={false}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
        windowSize={3}
      />

      <View style={styles.footer}>
        <Pagination scrollX={scrollX} dataLength={data.length} />
        <RectButton style={styles.nextButton} onPress={handleNext}>
          <ChevronRight size={SIZES.icon} color={Colors.PrimaryBackground} />
        </RectButton>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.PrimaryBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.header.horizontal,
    paddingVertical: SPACING.header.vertical,
  },
  skipButton: {
    paddingHorizontal: SIZES.skipButton.horizontal,
    paddingVertical: SIZES.skipButton.vertical,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  skipText: {
    fontSize: FONT_SIZES.skip,
    fontFamily: FontFamilies.bold,
    color: Colors.PrimaryText,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  imageContainer: {
    flex: 1.2,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textWrapper: {
    height: SIZES.textWrapper,
    position: 'relative',
  },
  textContainer: {
    height: SIZES.textContainer,
    borderTopLeftRadius: SIZES.borderRadius,
    borderTopRightRadius: SIZES.borderRadius,
    paddingVertical: SPACING.text.vertical,
    paddingHorizontal: SPACING.text.horizontal,
    gap: SPACING.text.gap,
    backgroundColor: Colors.SecondaryBackground,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontFamily: FontFamilies.bold,
    color: Colors.PrimaryText,
    textAlign: 'center',
    lineHeight: LINE_HEIGHTS.title,
  },
  description: {
    fontSize: FONT_SIZES.description,
    fontFamily: FontFamilies.regular,
    color: Colors.PrimaryText,
    textAlign: 'center',
    lineHeight: LINE_HEIGHTS.description,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.footer.horizontal,
    paddingVertical: SPACING.footer.vertical,
    backgroundColor: Colors.SecondaryBackground,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.PrimaryText,
    marginHorizontal: 4,
  },
  nextButton: {
    width: SIZES.nextButton,
    height: SIZES.nextButton,
    borderRadius: SIZES.nextButton / 2,
    backgroundColor: Colors.SecondaryText,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
