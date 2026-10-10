import { AppEnvironment } from '../types'

export const detectEnvironment = (): AppEnvironment => {
  if (typeof window === 'undefined') return 'server'

  const userAgent = navigator?.userAgent?.toLowerCase?.()

  if ((window as any)?.ReactNativeWebView) return 'react-native-webview'
  if (/instagram/i.test(userAgent)) return 'instagram-inapp'
  if (/facebook|fbav|fb_iab/i.test(userAgent)) return 'facebook-inapp'
  if (/twitter/i.test(userAgent)) return 'twitter-inapp'
  if (/(inapp|wkwebview|messenger)/i.test(userAgent)) return 'generic-inapp'
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile-browser'

  return 'desktop-browser'
}

export const getOfflineHTML = (): string => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>iScan - Offline</title>
    <style>
        body {
            background: rgba(241, 241, 235, 1);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        .offline-container {
            max-width: 400px;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        h1 {
            color: rgba(72, 89, 83, 1);
            margin-bottom: 16px;
        }
        p {
            color: rgba(146, 162, 156, 1);
            margin-bottom: 24px;
            line-height: 1.5;
        }
        .button {
            background: rgba(173, 137, 88, 1);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="icon">📶</div>
        <h1>You're Offline</h1>
        <p>Don't worry! Some features are still available. Please check your internet connection and try again.</p>
        <button class="button" onclick="window.location.reload()">Try Again</button>
    </div>
</body>
</html>
`
