import { z } from 'zod'

// Base Types
export const CoordinateSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
})

export const LandmarkSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
  visibility: z.number().optional(),
})

export const BoundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
})

// User Types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']),
    notifications: z.boolean(),
    haptics: z.boolean(),
    analytics: z.boolean(),
  }),
})

// Biometric Types
export const BiometricResultSchema = z.object({
  id: z.string(),
  type: z.enum(['face', 'iris', 'hand', 'pose', 'holistic']),
  confidence: z.number().min(0).max(1),
  landmarks: z.array(LandmarkSchema),
  boundingBox: BoundingBoxSchema.optional(),
  timestamp: z.date(),
  metadata: z.record(z.unknown()).optional(),
})

export const ScanSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['face', 'iris', 'hand', 'pose', 'holistic']),
  startTime: z.date(),
  endTime: z.date().optional(),
  results: z.array(BiometricResultSchema),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  accuracy: z.number().min(0).max(1).optional(),
  duration: z.number().optional(),
})

// Navigation Types
export const NavigationParamsSchema = z.object({
  Home: z.undefined(),
  Scanner: z
    .object({
      scanType: z.enum(['face', 'iris', 'hand', 'pose', 'holistic']).optional(),
    })
    .optional(),
  Analytics: z.undefined(),
  Profile: z.undefined(),
  Settings: z.undefined(),
  ScanResults: z.object({
    sessionId: z.string(),
    results: z.array(BiometricResultSchema),
  }),
  IrisRecognition: z.undefined(),
  ARVisualization: z.object({
    data: BiometricResultSchema,
  }),
})

// Component Props Types
export const AnimatedCardPropsSchema = z.object({
  children: z.any(),
  style: z.any().optional(),
  onPress: z.function().optional(),
  disabled: z.boolean().optional(),
  elevation: z.number().optional(),
  borderRadius: z.number().optional(),
})

export const GestureHandlerPropsSchema = z.object({
  onSwipeLeft: z.function().optional(),
  onSwipeRight: z.function().optional(),
  onSwipeUp: z.function().optional(),
  onSwipeDown: z.function().optional(),
  onPinch: z.function().optional(),
  onRotate: z.function().optional(),
  onDoubleTap: z.function().optional(),
  onLongPress: z.function().optional(),
})

// Export inferred types
export type Coordinate = z.infer<typeof CoordinateSchema>
export type Landmark = z.infer<typeof LandmarkSchema>
export type BoundingBox = z.infer<typeof BoundingBoxSchema>
export type User = z.infer<typeof UserSchema>
export type BiometricResult = z.infer<typeof BiometricResultSchema>
export type ScanSession = z.infer<typeof ScanSessionSchema>
export type NavigationParams = z.infer<typeof NavigationParamsSchema>
export type AnimatedCardProps = z.infer<typeof AnimatedCardPropsSchema>
export type GestureHandlerProps = z.infer<typeof GestureHandlerPropsSchema>

// Theme Types
export interface ThemeColors {
  primary: string
  primaryDark: string
  primaryLight: string
  secondary: string
  secondaryDark: string
  secondaryLight: string
  accent: string
  background: string
  surface: string
  card: string
  text: string
  textSecondary: string
  textDisabled: string
  success: string
  warning: string
  error: string
  info: string
  border: string
  divider: string
  glass: string
  glassLight: string
  glassDark: string
}

export interface ThemeSpacing {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  xxl: number
}

export interface ThemeTypography {
  h1: { fontSize: number; fontWeight: string; lineHeight: number }
  h2: { fontSize: number; fontWeight: string; lineHeight: number }
  h3: { fontSize: number; fontWeight: string; lineHeight: number }
  h4: { fontSize: number; fontWeight: string; lineHeight: number }
  body: { fontSize: number; fontWeight: string; lineHeight: number }
  caption: { fontSize: number; fontWeight: string; lineHeight: number }
  button: { fontSize: number; fontWeight: string; lineHeight: number }
}

export interface Theme {
  colors: ThemeColors
  spacing: ThemeSpacing
  typography: ThemeTypography
  borderRadius: {
    small: number
    medium: number
    large: number
    round: number
  }
  shadows: {
    small: object
    medium: object
    large: object
  }
}

export type AppEnvironment =
  | 'react-native-webview'
  | 'facebook-inapp'
  | 'instagram-inapp'
  | 'twitter-inapp'
  | 'generic-inapp'
  | 'mobile-browser'
  | 'desktop-browser'
  | 'server'

export type WebViewMessage = {
  type: string
  [key: string]: any
}

export type AppRoute =
  | 'home'
  | 'dashboard'
  | 'live'
  | 'icare'
  | 'history'
  | 'settings'
  | 'profile'
  | 'signin'
  | 'register'

export type NavigationState = {
  canGoBack: boolean
  canGoForward: boolean
  url: string
  title: string
  loading: boolean
}

export type NetworkState = {
  isConnected: boolean | null
  isInternetReachable: boolean | null
  type: string
}

export type OfflineCache = {
  url: string
  html: string
  timestamp: number
  title: string
}
