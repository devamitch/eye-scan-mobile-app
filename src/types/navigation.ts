import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  OnboardingScreen: undefined;
  WelcomeScreen: undefined;
  MainWebView: undefined;
};

export type ScreenNavigationProp<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

export type ScreenRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;

export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: ScreenNavigationProp<T>;
  route: ScreenRouteProp<T>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
