import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, Linking, Platform, Share, StyleSheet } from 'react-native';
import RNFS from 'react-native-fs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { LoadingOverlay } from '../components/WebView/LoadingOverlay';
import { OfflineFallback } from '../components/WebView/OfflineFallback';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useOfflineCache } from '../hooks/useOfflineCache';
import { useBrowserStore, useSavedCredentials, useSessionManager } from '../store/web-store';
import { Colors } from '../themes/color';
import { AppEnvironment, AppRoute, NavigationState, WebViewMessage } from '../types';
import { checkCameraPermission, ensureCameraPermission } from '../utils/cameraUtils';
import { detectEnvironment } from '../utils/environmentUtils';

const BASE_URL = 'https://olo-care.com';
const LOAD_TIMEOUT = 30000;
const AUTO_LOGIN_DELAY = 2000;
const PAGE_LOAD_DELAY = 1000;

const APP_ROUTES: Record<AppRoute, string> = {
  home: '/',
  dashboard: '/dashboard',
  live: '/live',
  icare: '/icare',
  history: '/history',
  settings: '/settings',
  profile: '/profile',
  signin: '/signin',
  register: '/register',
};

interface LoadingState {
  isLoading: boolean;
  progress: number;
  hasError: boolean;
  errorMessage?: string;
}

export const MainWebView: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const loadTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitialized = useRef(false);
  const retryCountRef = useRef(0);
  const lastUrlRef = useRef<string>('');
  const isNavigatingRef = useRef(false);

  // Store selectors
  const currentUrl = useBrowserStore(state => state.currentUrl);
  const lastActiveUrl = useBrowserStore(state => state.lastActiveUrl);
  const currentNavigationState = useBrowserStore(state => state.currentNavigationState);
  const settings = useBrowserStore(state => state.settings);
  const updateNavigationState = useBrowserStore(state => state.updateNavigationState);
  const setCurrentUrl = useBrowserStore(state => state.setCurrentUrl);
  const login = useBrowserStore(state => state.login);
  const logout = useBrowserStore(state => state.logout);
  const updateSessionCookies = useBrowserStore(state => state.updateSessionCookies);

  // Hooks
  const { isLoggedIn, checkAndRenewSession, applySavedCookies } = useSessionManager();
  const { getSavedCredentials, hasCredentials } = useSavedCredentials();
  const networkState = useNetworkStatus();
  const { getCachedPage, savePageToCache, loadCachedPages } = useOfflineCache();

  // Local state
  const [environment, setEnvironment] = useState<AppEnvironment>('server');
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    hasError: false,
  });
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState<string>('');

  // ============================================================================
  // LIFECYCLE MANAGEMENT
  // ============================================================================

  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        const isValidSession = checkAndRenewSession();
        if (!isValidSession && hasCredentials && settings.autoLogin) {
          setAutoLoginAttempted(false);
        }
      }
    });

    return () => subscription?.remove();
  }, [checkAndRenewSession, hasCredentials, settings.autoLogin]);

  useFocusEffect(
    useCallback(() => {
      if (loadingState.hasError) {
        setLoadingState({
          isLoading: false,
          progress: 0,
          hasError: false,
        });
      }
      return () => {};
    }, [loadingState.hasError])
  );

  // 🔧 FIX: Better initialization
  useEffect(() => {
    if (isInitialized.current) return;

    const initialize = async () => {
      isInitialized.current = true;

      try {
        await loadCachedPages();
        setEnvironment(detectEnvironment());

        const isValidSession = checkAndRenewSession();

        let initialUrl = `${BASE_URL}/en/dashboard`;
        await checkCameraPermission();

        if (isValidSession && isLoggedIn && lastActiveUrl) {
          initialUrl = lastActiveUrl;
        } else if (hasCredentials && settings.autoLogin) {
          initialUrl = `${BASE_URL}/en/signin`;
        }

        setWebViewUrl(initialUrl);
        setCurrentUrl(initialUrl);
        lastUrlRef.current = initialUrl;

        // 🔧 FIX: Complete initial load after a delay
        setTimeout(() => {
          setInitialLoadComplete(true);
          setIsWebViewReady(true);
        }, 1000);
      } catch (error) {
        console.error('[MainWebView] Initialization error:', error);
        setLoadingState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: 'Failed to initialize app',
        }));
      }
    };

    initialize();

    return () => {
      isInitialized.current = false;
      setInitialLoadComplete(false);
      setAutoLoginAttempted(false);
      setIsWebViewReady(false);
      retryCountRef.current = 0;
    };
  }, []);

  useEffect(() => {
    if (initialLoadComplete && isLoggedIn && isWebViewReady) {
      applySavedCookies(webViewRef);
    }
  }, [initialLoadComplete, isLoggedIn, isWebViewReady, applySavedCookies]);

  // ============================================================================
  // LOADING TIMEOUT HANDLER
  // ============================================================================

  const startLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    loadTimeoutRef.current = setTimeout(() => {
      console.warn('[MainWebView] Load timeout reached');
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        progress: 1,
        hasError: true,
        errorMessage: 'Page load timeout',
      }));
    }, LOAD_TIMEOUT);
  }, []);

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = undefined;
    }
  }, []);

  // ============================================================================
  // AUTO-LOGIN HANDLER
  // ============================================================================

  const handleAutoLogin = useCallback(() => {
    if (autoLoginAttempted || !settings.autoLogin || !hasCredentials || isLoggedIn) {
      return;
    }

    const credentials = getSavedCredentials();
    if (!credentials) return;

    console.log('[MainWebView] Attempting auto-login');
    setAutoLoginAttempted(true);

    if (timeoutRefs.current.autoLogin) {
      clearTimeout(timeoutRefs.current.autoLogin);
    }

    timeoutRefs.current.autoLogin = setTimeout(() => {
      webViewRef.current?.injectJavaScript(`
        (function() {
          try {
            const authToken = localStorage.getItem('authToken') || localStorage.getItem('user');
            if (authToken) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ALREADY_LOGGED_IN',
                timestamp: Date.now()
              }));
              return true;
            }
          } catch (e) {
            console.error('Auth check failed:', e);
          }
          
          const waitForForm = (attempts = 0) => {
            if (attempts > 20) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'AUTO_LOGIN_FAILED',
                reason: 'Form not found',
                timestamp: Date.now()
              }));
              return;
            }
            
            const emailInput = document.querySelector('input[type="email"], input[name="email"]');
            const passwordInput = document.querySelector('input[type="password"]');
            
            if (emailInput && passwordInput) {
              try {
                emailInput.value = '${credentials.email}';
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                emailInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                passwordInput.value = '${credentials.password}';
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                setTimeout(() => {
                  const submitButton = document.querySelector('button[type="submit"]');
                  if (submitButton) {
                    submitButton.click();
                  } else {
                    const form = emailInput.closest('form');
                    if (form) {
                      form.submit();
                    } else {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'AUTO_LOGIN_FAILED',
                        reason: 'Submit button not found',
                        timestamp: Date.now()
                      }));
                    }
                  }
                }, 1000);
              } catch (e) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'AUTO_LOGIN_FAILED',
                  reason: e.message,
                  timestamp: Date.now()
                }));
              }
            } else {
              setTimeout(() => waitForForm(attempts + 1), 500);
            }
          };
          
          waitForForm();
          return true;
        })();
      `);
    }, AUTO_LOGIN_DELAY);
  }, [settings.autoLogin, hasCredentials, isLoggedIn, autoLoginAttempted, getSavedCredentials]);

  // ============================================================================
  // NAVIGATION HANDLER
  // ============================================================================

  const handleNavigationStateChange = useCallback(
    (navState: any) => {
      // Ignore about:blank to prevent loops
      if (!navState.url || navState.url === 'about:blank') {
        return;
      }

      console.log('[MainWebView] Navigation:', navState.url, 'Loading:', navState.loading);

      // Prevent rapid state updates
      if (navState.url === lastUrlRef.current && navState.loading) {
        return;
      }

      const newNavigationState: NavigationState = {
        canGoBack: navState.canGoBack,
        canGoForward: navState.canGoForward,
        url: navState.url,
        title: navState.title || 'oLo - Eye Wellness',
        loading: navState.loading,
      };

      updateNavigationState(newNavigationState);

      // Handle external URLs
      if (navState.url && !navState.url.includes('olo-care.com')) {
        webViewRef.current?.stopLoading();
        Linking.openURL(navState.url).catch(err => {
          console.error('[MainWebView] Failed to open external URL:', err);
        });
        return false;
      }

      // Update last URL ref when navigation completes
      if (!navState.loading && navState.url !== lastUrlRef.current) {
        lastUrlRef.current = navState.url;
        setLoadingState(prev => ({
          ...prev,
          hasError: false,
          errorMessage: undefined,
        }));
      }

      // Handle auto-login on signin page
      if (
        !navState.loading &&
        navState.url.includes('/signin') &&
        !isLoggedIn &&
        !autoLoginAttempted
      ) {
        if (timeoutRefs.current.autoLogin) {
          clearTimeout(timeoutRefs.current.autoLogin);
        }
        timeoutRefs.current.autoLogin = setTimeout(() => handleAutoLogin(), 1000);
      }
    },
    [updateNavigationState, isLoggedIn, autoLoginAttempted, handleAutoLogin]
  );

  // ============================================================================
  // SHARE HANDLER
  // ============================================================================

  const handleShareImage = useCallback(async (data: any) => {
    try {
      const base64Data = data.image.replace(/^data:image\/\w+;base64,/, '');
      const filename = `eye-wellness-${Date.now()}.png`;
      const filepath = `${RNFS.CachesDirectoryPath}/${filename}`;

      await RNFS.writeFile(filepath, base64Data, 'base64');

      const result = await Share.share({
        title: data.title || 'Eye Wellness Report',
        message: data.message || 'Check out my eye wellness report!',
        url: Platform.OS === 'android' ? `file://${filepath}` : filepath,
      });

      if (result.action === Share.sharedAction) {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: 'SHARE_SUCCESS',
            timestamp: Date.now(),
          })
        );
      }

      if (timeoutRefs.current.shareCleanup) {
        clearTimeout(timeoutRefs.current.shareCleanup);
      }

      timeoutRefs.current.shareCleanup = setTimeout(async () => {
        try {
          if (await RNFS.exists(filepath)) {
            await RNFS.unlink(filepath);
          }
        } catch (e) {
          console.error('[MainWebView] Failed to cleanup share file:', e);
        }
      }, 3000);
    } catch (error) {
      console.error('[MainWebView] Share image error:', error);
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: 'SHARE_ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        })
      );
    }
  }, []);

  // ============================================================================
  // MESSAGE HANDLER
  // ============================================================================

  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      try {
        const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
        console.log('[MainWebView] Received message:', data.type);

        switch (data.type) {
          case 'REQUEST_CAMERA_ACCESS':
            const hasPermission = await ensureCameraPermission();
            webViewRef.current?.injectJavaScript(`
              window.dispatchEvent(new CustomEvent('cameraPermission', { 
                detail: { granted: ${hasPermission} }
              }));
            `);
            break;

          case 'SHARE_IMAGE':
            await handleShareImage(data);
            break;

          case 'PAGE_LOADED':
            console.log('[MainWebView] Page loaded:', data.url);

            if (data.url === 'about:blank') {
              console.log('[MainWebView] Ignoring about:blank page load');
              break;
            }

            if (!initialLoadComplete) {
              setInitialLoadComplete(true);
              setIsWebViewReady(true);
            }

            if (networkState.isConnected) {
              if (timeoutRefs.current.pageLoad) {
                clearTimeout(timeoutRefs.current.pageLoad);
              }

              timeoutRefs.current.pageLoad = setTimeout(() => {
                webViewRef.current?.injectJavaScript(`
                  (function() {
                    try {
                      const cookies = document.cookie
                        .split(';')
                        .map(c => c.trim())
                        .filter(c => c.length > 0);
                      
                      if (cookies.length > 0) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'COOKIES_EXTRACTED',
                          cookies: cookies,
                          timestamp: Date.now()
                        }));
                      }
                      
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'PAGE_CONTENT',
                        html: document.documentElement.outerHTML,
                        url: window.location.href,
                        title: document.title,
                        timestamp: Date.now()
                      }));
                    } catch (e) {
                      console.error('Content extraction failed:', e);
                    }
                  })();
                `);
              }, PAGE_LOAD_DELAY);
            }
            break;

          case 'AUTH_STATE_CHECK':
            if (data.isLoggedIn && !isLoggedIn) {
              console.log('[MainWebView] User logged in');
              login({
                email: data.userEmail || '',
                password: '',
                rememberMe: true,
              });
            } else if (!data.isLoggedIn && isLoggedIn) {
              console.log('[MainWebView] User logged out');
              logout();
            }
            break;

          case 'COOKIES_EXTRACTED':
            if (data.cookies?.length > 0) {
              updateSessionCookies(data.cookies);
            }
            break;

          case 'PAGE_CONTENT':
            if (data.url && data.html && data.title) {
              savePageToCache(data.url, data.html, data.title);
            }
            break;

          case 'NAVIGATE_TO_ROUTE':
            if (data.route) {
              navigateToRoute(data.route as AppRoute);
            }
            break;

          case 'LOGIN_SUCCESS':
            console.log('[MainWebView] Login successful');
            if (data.userInfo?.email && !isLoggedIn) {
              login({
                email: data.userInfo.email,
                password: '',
                rememberMe: true,
              });
            }
            break;

          case 'LOGOUT_SUCCESS':
            console.log('[MainWebView] Logout successful');
            if (isLoggedIn) {
              logout();
              setAutoLoginAttempted(false);
            }
            break;

          case 'AUTO_LOGIN_FAILED':
            console.warn('[MainWebView] Auto-login failed:', data.reason);
            setAutoLoginAttempted(true);
            break;

          case 'ALREADY_LOGGED_IN':
            console.log('[MainWebView] Already logged in');
            setAutoLoginAttempted(true);
            break;

          case 'FORM_SUBMITTED':
            if (data.formType === 'login' && data.email) {
              const credentials = getSavedCredentials();
              if (credentials && credentials.email !== data.email) {
                login({
                  email: data.email,
                  password: credentials.password,
                  rememberMe: true,
                });
              }
            }
            break;

          default:
            console.log('[MainWebView] Unhandled message type:', data.type);
        }
      } catch (error) {
        console.error('[MainWebView] Error handling message:', error);
      }
    },
    [
      networkState.isConnected,
      savePageToCache,
      updateSessionCookies,
      login,
      logout,
      isLoggedIn,
      initialLoadComplete,
      handleShareImage,
      getSavedCredentials,
    ]
  );

  // ============================================================================
  // WEBVIEW EVENT HANDLERS
  // ============================================================================

  const handleLoadStart = useCallback(() => {
    console.log('[MainWebView] Load started');
    setLoadingState({
      isLoading: true,
      progress: 0.1,
      hasError: false,
    });
    startLoadTimeout();
  }, [startLoadTimeout]);

  const handleLoadProgress = useCallback(({ nativeEvent }: any) => {
    setLoadingState(prev => ({
      ...prev,
      progress: nativeEvent.progress,
    }));
  }, []);

  const handleLoadEnd = useCallback(() => {
    console.log('[MainWebView] Load completed');
    clearLoadTimeout();
    setLoadingState({
      isLoading: false,
      progress: 1,
      hasError: false,
    });
    retryCountRef.current = 0;
  }, [clearLoadTimeout]);

  const handleError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      console.error('[MainWebView] Load error:', nativeEvent);

      clearLoadTimeout();
      setLoadingState({
        isLoading: false,
        progress: 1,
        hasError: true,
        errorMessage: nativeEvent.description || 'Failed to load page',
      });

      retryCountRef.current += 1;
    },
    [clearLoadTimeout]
  );

  const handleHttpError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      console.error('[MainWebView] HTTP error:', nativeEvent.statusCode);

      if (nativeEvent.statusCode >= 400) {
        clearLoadTimeout();
        setLoadingState({
          isLoading: false,
          progress: 1,
          hasError: true,
          errorMessage: `HTTP Error ${nativeEvent.statusCode}`,
        });

        retryCountRef.current += 1;
      }
    },
    [clearLoadTimeout]
  );

  // ============================================================================
  // NAVIGATION FUNCTIONS
  // ============================================================================

  const navigateToRoute = useCallback(
    (route: AppRoute) => {
      const path = APP_ROUTES[route];
      if (path) {
        const fullUrl = `${BASE_URL}/en${path}`;
        console.log('[MainWebView] Navigating to:', fullUrl);

        if (lastUrlRef.current === fullUrl) {
          console.log('[MainWebView] Already at target URL, skipping navigation');
          return;
        }

        isNavigatingRef.current = true;
        lastUrlRef.current = fullUrl;

        setWebViewUrl(fullUrl);
        setCurrentUrl(fullUrl);

        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 1000);
      }
    },
    [setCurrentUrl]
  );

  const reload = useCallback(() => {
    console.log('[MainWebView] Reloading WebView');
    webViewRef.current?.reload();
    setLoadingState({
      isLoading: true,
      progress: 0,
      hasError: false,
    });
    setAutoLoginAttempted(false);
    retryCountRef.current = 0;
  }, []);

  const goHome = useCallback(() => {
    navigateToRoute(isLoggedIn ? 'dashboard' : 'home');
  }, [navigateToRoute, isLoggedIn]);

  const sourceUrl = useMemo(() => {
    if (!networkState.isConnected) {
      const cachedPage = getCachedPage(webViewUrl);
      if (cachedPage) {
        console.log('[MainWebView] Loading from cache:', webViewUrl);
        return `data:text/html;base64,${btoa(cachedPage.html)}`;
      }
    }

    const url = webViewUrl || `${BASE_URL}/en/dashboard`;
    console.log('[MainWebView] Source URL:', url);
    return url;
  }, [webViewUrl, networkState.isConnected, getCachedPage]);

  const injectedJavaScript = useMemo(
    () => `
    (function() {
      console.log('[WebView] Initializing native app mode...');
      
      // Apply native app styling
      if (document.body) {
        document.body.style.backgroundColor = '${Colors.PrimaryBackground}';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.webkitTouchCallout = 'none';
        document.body.style.userSelect = 'none';
        document.body.style.touchAction = 'manipulation';
      }
      
      // Disable all browser-like behaviors
      document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
      }, { passive: false });
      
      document.addEventListener('gesturechange', function(e) {
        e.preventDefault();
      }, { passive: false });
      
      document.addEventListener('gestureend', function(e) {
        e.preventDefault();
      }, { passive: false });
      
      // Prevent zoom
      document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      }, { passive: false });
      
      // Prevent double-tap zoom
      let lastTouchEnd = 0;
      document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
      
      // Disable context menu (long press)
      document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
      }, { passive: false });
      
      // Prevent text selection
      document.addEventListener('selectstart', function(e) {
        if (!e.target.matches('input, textarea')) {
          e.preventDefault();
        }
      }, { passive: false });
      
      // Add smooth scrolling for better feel
      if (document.documentElement) {
        document.documentElement.style.scrollBehavior = 'smooth';
        document.documentElement.style.webkitOverflowScrolling = 'touch';
      }
      
      // Prevent pull-to-refresh on iOS
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overscrollBehavior = 'none';
      
      const handleLoad = () => {
        console.log('[WebView] Page loaded in native app mode');
        setTimeout(() => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAGE_LOADED',
            url: window.location.href,
            title: document.title,
            timestamp: Date.now()
          }));
        }, 500);
      };
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleLoad);
      } else {
        handleLoad();
      }
      
      window.requestCameraAccess = async () => {
        return new Promise((resolve) => {
          const handler = (event) => {
            if (event.detail) {
              window.removeEventListener('cameraPermission', handler);
              resolve(event.detail.granted);
            }
          };
          window.addEventListener('cameraPermission', handler);
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'REQUEST_CAMERA_ACCESS',
            timestamp: Date.now()
          }));
          
          setTimeout(() => {
            window.removeEventListener('cameraPermission', handler);
            resolve(false);
          }, 10000);
        });
      };
      
      window.addEventListener('error', (event) => {
        console.error('[WebView] Error:', event.message);
      });
      
      console.log('[WebView] Native app initialization complete');
      true;
    })();
  `,
    []
  );

  // ============================================================================
  // ANDROID BACK BUTTON
  // ============================================================================

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (currentNavigationState.canGoBack) {
          webViewRef.current?.goBack();
          return true;
        }
        return false;
      });

      return () => backHandler.remove();
    }, [currentNavigationState.canGoBack])
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  const cachedPage = getCachedPage(webViewUrl);
  const showOfflineFallback = !networkState.isConnected && loadingState.hasError && !cachedPage;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LoadingOverlay visible={loadingState.isLoading && loadingState.progress < 1} />

      {showOfflineFallback ? (
        <OfflineFallback
          onRetry={reload}
          onGoHome={goHome}
          cachedContent={cachedPage?.html ?? ''}
        />
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: sourceUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          allowsBackForwardNavigationGestures={false}
          onLoadStart={handleLoadStart}
          onLoadProgress={handleLoadProgress}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onHttpError={handleHttpError}
          startInLoadingState={true}
          onMessage={handleMessage}
          injectedJavaScript={injectedJavaScript}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          cacheEnabled={true}
          cacheMode={networkState.isConnected ? 'LOAD_DEFAULT' : 'LOAD_CACHE_ELSE_NETWORK'}
          incognito={false}
          pullToRefreshEnabled={false}
          geolocationEnabled={true}
          overScrollMode={'never'}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEnabled={true}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          decelerationRate="normal"
          renderError={() => (
            <OfflineFallback
              onRetry={reload}
              onGoHome={goHome}
              errorMessage={loadingState.errorMessage}
            />
          )}
          originWhitelist={['*']}
          userAgent={
            Platform.OS === 'ios'
              ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 OloEyeWellness/1.0'
              : 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Mobile OloEyeWellness/1.0'
          }
          androidHardwareAccelerationDisabled={false}
          androidLayerType="hardware"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.PrimaryBackground,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.PrimaryBackground,
  },
});
