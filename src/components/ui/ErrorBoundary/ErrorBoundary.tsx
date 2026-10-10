import { AlertCircle, RotateCcw } from 'lucide-react-native';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontFamilies } from '../../../hooks/useAppFonts';
import { Colors } from '../../../themes/color';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <AlertCircle
                size={32}
                color={Colors.SecondaryText}
                strokeWidth={1.5}
              />
            </View>

            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              The app encountered an unexpected error.{'\n'}Please try again.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            <Pressable style={styles.retryButton} onPress={this.handleRetry}>
              <RotateCcw
                size={16}
                color={Colors.PrimaryBackground}
                strokeWidth={1.5}
              />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.PrimaryBackground,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: FontFamilies.medium,
    color: Colors.PrimaryText,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FontFamilies.regular,
    color: Colors.SecondaryText,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: Colors.SecondaryBackground,
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
    maxHeight: 160,
  },
  errorTitle: {
    fontSize: 14,
    fontFamily: FontFamilies.medium,
    color: Colors.PrimaryText,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FontFamilies.regular,
    color: Colors.SecondaryText,
    lineHeight: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PrimaryText,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontFamily: FontFamilies.medium,
    color: Colors.PrimaryBackground,
  },
});
