import { Home, RefreshCw, WifiOff } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontFamilies } from '../../hooks/useAppFonts';
import { Colors } from '../../themes/color';

interface OfflineFallbackProps {
  onRetry: () => void;
  onGoHome: () => void;
  cachedContent?: string;
}

export const OfflineFallback: React.FC<OfflineFallbackProps> = ({
  onRetry,
  onGoHome,
  cachedContent,
}) => {
  if (cachedContent) {
    return (
      <View style={styles.cachedContainer}>
        <Text style={styles.cachedTitle}>Showing cached version</Text>
        <Text style={styles.cachedText}>
          You're viewing an offline copy of the page
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WifiOff size={64} color={Colors.lightText} />
      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.message}>
        Please check your connection and try again. Some features may be limited
        while offline.
      </Text>

      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <RefreshCw size={20} color={Colors.PrimaryBackground} />
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.homeButton]}
        onPress={onGoHome}
      >
        <Home size={20} color={Colors.PrimaryBackground} />
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.PrimaryBackground,
  },
  cachedContainer: {
    padding: 16,
    backgroundColor: Colors.SecondaryText,
    alignItems: 'center',
  },
  cachedTitle: {
    fontSize: 14,
    fontFamily: FontFamilies.bold,
    color: Colors.PrimaryBackground,
  },
  cachedText: {
    fontSize: 12,
    fontFamily: FontFamilies.regular,
    color: Colors.PrimaryBackground,
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamilies.bold,
    color: Colors.PrimaryText,
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    fontFamily: FontFamilies.regular,
    color: Colors.lightText,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.SecondaryText,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    justifyContent: 'center',
  },
  homeButton: {
    backgroundColor: Colors.PrimaryText,
  },
  buttonText: {
    color: Colors.PrimaryBackground,
    fontSize: 16,
    fontFamily: FontFamilies.medium,
    marginLeft: 8,
  },
});
