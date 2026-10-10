'use client';

import React, { memo, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../themes/color';

interface LoadingOverlayProps {
  visible: boolean;
  variant?: 'dashboard' | 'content' | 'simple';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BREAKPOINTS = {
  SMALL: 375,
  MEDIUM: 428,
} as const;

const isSmallDevice = SCREEN_WIDTH < BREAKPOINTS.SMALL;
const isMediumDevice = SCREEN_WIDTH >= BREAKPOINTS.SMALL && SCREEN_WIDTH < BREAKPOINTS.MEDIUM;

const SIZES = {
  eyeSize: isSmallDevice ? 120 : isMediumDevice ? 140 : 160,
  pupilSize: isSmallDevice ? 36 : isMediumDevice ? 44 : 52,
  irisSize: isSmallDevice ? 64 : isMediumDevice ? 76 : 88,
  spacing: isSmallDevice ? 16 : 20,
};

const EYE_EXERCISES = [
  'Relax your eyes...',
  'Take a deep breath...',
  'Blink slowly...',
  'Look into distance...',
  'Rest and restore...',
  'Find your comfort...',
];

// ============================================================================
// ANIMATED EYE COMPONENT
// ============================================================================

const AnimatedEye: React.FC = memo(() => {
  const pupilX = useSharedValue(0);
  const pupilY = useSharedValue(0);
  const blinkProgress = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const irisScale = useSharedValue(1);
  const eyeScale = useSharedValue(1);

  useEffect(() => {
    // Smooth, natural eye movements
    const exerciseSequence = () => {
      pupilX.value = withSequence(
        withTiming(-10, { duration: 1200, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withDelay(600, withTiming(0, { duration: 800 })),
        withTiming(10, { duration: 1200, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withDelay(600, withTiming(0, { duration: 800 })),
        withTiming(-8, { duration: 700 }),
        withTiming(8, { duration: 700 }),
        withTiming(0, { duration: 700 })
      );

      pupilY.value = withSequence(
        withTiming(0, { duration: 3200 }),
        withTiming(-8, { duration: 1200, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withDelay(600, withTiming(0, { duration: 800 })),
        withTiming(8, { duration: 1200, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withDelay(600, withTiming(0, { duration: 800 }))
      );
    };

    exerciseSequence();
    const interval = setInterval(exerciseSequence, 9000);

    // Natural blink
    blinkProgress.value = withRepeat(
      withSequence(
        withDelay(3000, withTiming(0.05, { duration: 80 })),
        withTiming(1, { duration: 120 }),
        withDelay(200, withTiming(0.05, { duration: 80 })),
        withTiming(1, { duration: 120 })
      ),
      -1,
      false
    );

    // Gentle glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withTiming(0.3, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      ),
      -1,
      false
    );

    // Subtle iris breathing
    irisScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.97, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Gentle eye scale
    eyeScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    return () => {
      clearInterval(interval);
      // Cancel all animations on unmount
      cancelAnimation(pupilX);
      cancelAnimation(pupilY);
      cancelAnimation(blinkProgress);
      cancelAnimation(glowOpacity);
      cancelAnimation(irisScale);
      cancelAnimation(eyeScale);
    };
  }, []);

  const pupilStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pupilX.value }, { translateY: pupilY.value }],
  }));

  const eyelidStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blinkProgress.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const irisStyle = useAnimatedStyle(() => ({
    transform: [{ scale: irisScale.value }],
  }));

  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: eyeScale.value }],
  }));

  return (
    <Animated.View style={[styles.eyeContainer, eyeStyle]}>
      {/* Enhanced outer glow with gradient effect */}
      <Animated.View style={[styles.eyeGlow, glowStyle]} />
      <Animated.View style={[styles.eyeGlowInner, glowStyle]} />

      {/* Eye white (sclera) */}
      <View style={styles.eyeWhite}>
        {/* Subtle eye veins for realism */}
        <View style={styles.eyeVeins} />

        {/* Iris */}
        <Animated.View style={[styles.iris, irisStyle]}>
          {/* Enhanced iris pattern */}
          <View style={styles.irisPattern1} />
          <View style={styles.irisPattern2} />
          <View style={styles.irisPattern3} />
          <View style={styles.irisCenter} />

          {/* Pupil */}
          <Animated.View style={[styles.pupil, pupilStyle]}>
            {/* Multiple light reflections for depth */}
            <View style={styles.pupilReflection} />
            <View style={styles.pupilReflectionSmall} />
            <View style={styles.pupilReflectionTiny} />
          </Animated.View>
        </Animated.View>

        {/* Enhanced eyelids with subtle shadow */}
        <Animated.View style={[styles.eyelidTop, eyelidStyle]} />
        <Animated.View style={[styles.eyelidBottom, eyelidStyle]} />
      </View>

      {/* Eye highlights for gloss effect */}
      <View style={styles.eyeHighlight} />
    </Animated.View>
  );
});

AnimatedEye.displayName = 'AnimatedEye';

// ============================================================================
// FLOATING PARTICLES
// ============================================================================

const Particle: React.FC<{ index: number }> = memo(({ index }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const delay = index * 250;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-40, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        true
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(0.9, { duration: 2000 }), withTiming(0.2, { duration: 2000 })),
        -1,
        true
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1.2, { duration: 2500 }), withTiming(0.7, { duration: 2500 })),
        -1,
        true
      )
    );

    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 8000, easing: Easing.linear }), -1, false)
    );

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(opacity);
      cancelAnimation(scale);
      cancelAnimation(rotate);
    };
  }, [index]);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const angle = index * 45 * (Math.PI / 180);
  const radius = SIZES.eyeSize * 1.1;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: '50%',
          top: '50%',
          marginLeft: x - 5,
          marginTop: y - 5,
        },
        particleStyle,
      ]}
    />
  );
});

Particle.displayName = 'Particle';

const FloatingParticles: React.FC = memo(() => {
  const particles = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <View style={styles.particlesContainer}>
      {particles.map(index => (
        <Particle key={index} index={index} />
      ))}
    </View>
  );
});

FloatingParticles.displayName = 'FloatingParticles';

// ============================================================================
// PROGRESS RING
// ============================================================================

const ProgressRing: React.FC = memo(() => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(scale);
    };
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.progressRing, ringStyle]}>
      <View style={styles.progressArc} />
      <View style={styles.progressArc2} />
    </Animated.View>
  );
});

ProgressRing.displayName = 'ProgressRing';

// ============================================================================
// EXERCISE TEXT
// ============================================================================

const ExerciseText: React.FC = memo(() => {
  const [currentExercise, setCurrentExercise] = React.useState(0);
  const textOpacity = useSharedValue(1);
  const textTranslateY = useSharedValue(0);
  const textScale = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      textOpacity.value = withTiming(0, { duration: 300 });
      textScale.value = withTiming(0.95, { duration: 300 });

      setTimeout(() => {
        setCurrentExercise(prev => (prev + 1) % EYE_EXERCISES.length);
        textTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
        textOpacity.value = withTiming(1, { duration: 400 });
        textScale.value = withSpring(1, { damping: 12, stiffness: 120 });
      }, 350);
    }, 3000);

    return () => {
      clearInterval(interval);
      cancelAnimation(textOpacity);
      cancelAnimation(textTranslateY);
      cancelAnimation(textScale);
    };
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }, { scale: textScale.value }],
  }));

  return (
    <Animated.Text style={[styles.exerciseText, textStyle]}>
      {EYE_EXERCISES[currentExercise]}
    </Animated.Text>
  );
});

ExerciseText.displayName = 'ExerciseText';

// ============================================================================
// BREATHING CIRCLES
// ============================================================================

const BreathingCircles: React.FC = memo(() => {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const opacity1 = useSharedValue(0.25);
  const opacity2 = useSharedValue(0.15);
  const opacity3 = useSharedValue(0.08);

  useEffect(() => {
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withTiming(1, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      ),
      -1,
      false
    );

    scale2.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(1, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        false
      )
    );

    scale3.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(1, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        false
      )
    );

    opacity1.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 3000 }), withTiming(0.2, { duration: 3000 })),
      -1,
      false
    );

    opacity2.value = withRepeat(
      withSequence(withTiming(0.25, { duration: 3000 }), withTiming(0.12, { duration: 3000 })),
      -1,
      false
    );

    opacity3.value = withRepeat(
      withSequence(withTiming(0.15, { duration: 3000 }), withTiming(0.06, { duration: 3000 })),
      -1,
      false
    );

    return () => {
      cancelAnimation(scale1);
      cancelAnimation(scale2);
      cancelAnimation(scale3);
      cancelAnimation(opacity1);
      cancelAnimation(opacity2);
      cancelAnimation(opacity3);
    };
  }, []);

  const circle1Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const circle2Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  const circle3Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity3.value,
  }));

  return (
    <View style={styles.breathingContainer}>
      <Animated.View style={[styles.breathingCircle, styles.breathingCircle3, circle3Style]} />
      <Animated.View style={[styles.breathingCircle, styles.breathingCircle2, circle2Style]} />
      <Animated.View style={[styles.breathingCircle, styles.breathingCircle1, circle1Style]} />
    </View>
  );
});

BreathingCircles.displayName = 'BreathingCircles';

// ============================================================================
// DASHBOARD SKELETON
// ============================================================================

const DashboardSkeleton: React.FC = memo(() => {
  const fadeIn = useSharedValue(0);
  const [dotsCount, setDotsCount] = React.useState(1);

  useEffect(() => {
    fadeIn.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    const dotsInterval = setInterval(() => {
      setDotsCount(prev => (prev % 3) + 1);
    }, 500);

    return () => {
      clearInterval(dotsInterval);
      cancelAnimation(fadeIn);
    };
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  return (
    <Animated.View style={[styles.content, containerStyle]}>
      <BreathingCircles />
      <ProgressRing />
      <AnimatedEye />
      <FloatingParticles />

      <View style={styles.textContainer}>
        <Text style={styles.title}>oLo</Text>
        <Text style={styles.subtitle}>Eye Wellness Companion</Text>
        <ExerciseText />
        <Text style={styles.loadingText}>
          Preparing your wellness dashboard{'.'.repeat(dotsCount)}
        </Text>
      </View>
    </Animated.View>
  );
});

DashboardSkeleton.displayName = 'DashboardSkeleton';

// ============================================================================
// SIMPLE SKELETON
// ============================================================================

const SimpleSkeleton: React.FC = memo(() => {
  const pulseOpacity = useSharedValue(0.5);
  const scale = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 1200 }), withTiming(0.5, { duration: 1200 })),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1,
      false
    );

    return () => {
      cancelAnimation(pulseOpacity);
      cancelAnimation(scale);
    };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.simpleContent}>
      <Animated.View style={[styles.simpleLogo, pulseStyle]}>
        <Text style={styles.simpleLogoText}>oLo</Text>
      </Animated.View>
      <Text style={styles.simpleText}>Loading...</Text>
    </View>
  );
});

SimpleSkeleton.displayName = 'SimpleSkeleton';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LoadingOverlay: React.FC<LoadingOverlayProps> = memo(
  ({ visible, variant = 'dashboard' }) => {
    if (!visible) return null;

    const renderContent = () => {
      switch (variant) {
        case 'content':
          return <DashboardSkeleton />;
        case 'simple':
          return <SimpleSkeleton />;
        case 'dashboard':
        default:
          return <DashboardSkeleton />;
      }
    };

    return <View style={styles.container}>{renderContent()}</View>;
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.PrimaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing,
  },

  // Breathing circles
  breathingContainer: {
    position: 'absolute',
    width: SIZES.eyeSize * 3.5,
    height: SIZES.eyeSize * 3.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
  },
  breathingCircle1: {
    width: SIZES.eyeSize * 2,
    height: SIZES.eyeSize * 2,
    borderColor: 'rgba(148, 171, 150, 0.3)',
  },
  breathingCircle2: {
    width: SIZES.eyeSize * 2.5,
    height: SIZES.eyeSize * 2.5,
    borderColor: 'rgba(148, 171, 150, 0.2)',
  },
  breathingCircle3: {
    width: SIZES.eyeSize * 3,
    height: SIZES.eyeSize * 3,
    borderColor: 'rgba(148, 171, 150, 0.12)',
  },

  // Progress ring
  progressRing: {
    position: 'absolute',
    width: SIZES.eyeSize * 1.65,
    height: SIZES.eyeSize * 1.65,
    borderRadius: SIZES.eyeSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressArc: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: SIZES.eyeSize,
    borderWidth: 2.5,
    borderColor: 'transparent',
    borderTopColor: Colors.logoColor,
    borderRightColor: 'rgba(173, 137, 88, 0.5)',
  },
  progressArc2: {
    position: 'absolute',
    width: '92%',
    height: '92%',
    borderRadius: SIZES.eyeSize,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderBottomColor: 'rgba(173, 137, 88, 0.25)',
    borderLeftColor: 'rgba(173, 137, 88, 0.15)',
  },

  // Eye container
  eyeContainer: {
    width: SIZES.eyeSize,
    height: SIZES.eyeSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeGlow: {
    position: 'absolute',
    width: SIZES.eyeSize * 1.6,
    height: SIZES.eyeSize * 1.6,
    borderRadius: SIZES.eyeSize,
    backgroundColor: 'rgba(148, 171, 150, 0.2)',
  },
  eyeGlowInner: {
    position: 'absolute',
    width: SIZES.eyeSize * 1.3,
    height: SIZES.eyeSize * 1.3,
    borderRadius: SIZES.eyeSize,
    backgroundColor: 'rgba(148, 171, 150, 0.15)',
  },
  eyeWhite: {
    width: SIZES.eyeSize,
    height: SIZES.eyeSize,
    borderRadius: SIZES.eyeSize / 2,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.PrimaryText,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  eyeVeins: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: SIZES.eyeSize,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 200, 0.1)',
  },
  iris: {
    width: SIZES.irisSize,
    height: SIZES.irisSize,
    borderRadius: SIZES.irisSize / 2,
    backgroundColor: Colors.SecondaryText,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: Colors.PrimaryText,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  irisPattern1: {
    position: 'absolute',
    width: SIZES.irisSize * 0.9,
    height: SIZES.irisSize * 0.9,
    borderRadius: SIZES.irisSize,
    borderWidth: 2,
    borderColor: 'rgba(72, 89, 83, 0.25)',
  },
  irisPattern2: {
    position: 'absolute',
    width: SIZES.irisSize * 0.75,
    height: SIZES.irisSize * 0.75,
    borderRadius: SIZES.irisSize,
    borderWidth: 1.5,
    borderColor: 'rgba(72, 89, 83, 0.15)',
  },
  irisPattern3: {
    position: 'absolute',
    width: SIZES.irisSize * 0.6,
    height: SIZES.irisSize * 0.6,
    borderRadius: SIZES.irisSize,
    borderWidth: 1,
    borderColor: 'rgba(72, 89, 83, 0.1)',
  },
  irisCenter: {
    position: 'absolute',
    width: SIZES.irisSize * 0.45,
    height: SIZES.irisSize * 0.45,
    borderRadius: SIZES.irisSize,
    backgroundColor: 'rgba(72, 89, 83, 0.08)',
  },
  pupil: {
    width: SIZES.pupilSize,
    height: SIZES.pupilSize,
    borderRadius: SIZES.pupilSize / 2,
    backgroundColor: Colors.PrimaryText,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.PrimaryText,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  pupilReflection: {
    position: 'absolute',
    top: 7,
    left: 7,
    width: SIZES.pupilSize * 0.35,
    height: SIZES.pupilSize * 0.35,
    borderRadius: SIZES.pupilSize,
    backgroundColor: Colors.white,
    opacity: 0.95,
  },
  pupilReflectionSmall: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: SIZES.pupilSize * 0.18,
    height: SIZES.pupilSize * 0.18,
    borderRadius: SIZES.pupilSize,
    backgroundColor: Colors.white,
    opacity: 0.6,
  },
  pupilReflectionTiny: {
    position: 'absolute',
    top: 14,
    right: 12,
    width: SIZES.pupilSize * 0.1,
    height: SIZES.pupilSize * 0.1,
    borderRadius: SIZES.pupilSize,
    backgroundColor: Colors.white,
    opacity: 0.4,
  },
  eyelidTop: {
    position: 'absolute',
    top: -SIZES.eyeSize / 2,
    width: SIZES.eyeSize,
    height: SIZES.eyeSize / 2,
    backgroundColor: Colors.PrimaryBackground,
    shadowColor: Colors.PrimaryText,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eyelidBottom: {
    position: 'absolute',
    bottom: -SIZES.eyeSize / 2,
    width: SIZES.eyeSize,
    height: SIZES.eyeSize / 2,
    backgroundColor: Colors.PrimaryBackground,
    shadowColor: Colors.PrimaryText,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eyeHighlight: {
    position: 'absolute',
    top: SIZES.eyeSize * 0.15,
    left: SIZES.eyeSize * 0.15,
    width: SIZES.eyeSize * 0.35,
    height: SIZES.eyeSize * 0.15,
    borderRadius: SIZES.eyeSize,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '25deg' }],
  },

  // Particles
  particlesContainer: {
    position: 'absolute',
    width: SIZES.eyeSize * 3,
    height: SIZES.eyeSize * 3,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.logoColor,
    shadowColor: Colors.logoColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },

  // Text content
  textContainer: {
    marginTop: SIZES.spacing * 5,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.PrimaryText,
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.lightText,
    marginTop: 6,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  exerciseText: {
    fontSize: 19,
    fontWeight: '600',
    color: Colors.SecondaryText,
    marginTop: SIZES.spacing * 2.5,
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.lightText,
    marginTop: SIZES.spacing * 1.5,
    fontWeight: '500',
    opacity: 0.8,
  },

  // Simple variant
  simpleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleLogo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.SecondaryText,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing * 1.5,
    shadowColor: Colors.SecondaryText,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  simpleLogoText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 2,
  },
  simpleText: {
    fontSize: 17,
    color: Colors.lightText,
    fontWeight: '500',
  },
});
