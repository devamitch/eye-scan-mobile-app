import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native'
import { Camera } from 'react-native-vision-camera'

export const checkCameraPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        title: 'Camera Permission',
        message: 'iScan needs access to your camera for eye scanning',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      })
      return granted === PermissionsAndroid.RESULTS.GRANTED
    } else {
      const permission = await Camera.requestCameraPermission()
      return permission === 'granted'
    }
  } catch (error) {
    console.error('Error checking camera permission:', error)
    return false
  }
}

export const showCameraPermissionAlert = () => {
  Alert.alert(
    'Camera Permission Required',
    'iScan needs camera access to perform eye scanning. Please enable camera permissions in settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => Linking.openSettings(),
      },
    ],
  )
}

export const ensureCameraPermission = async () => {
  const hasPermission = await checkCameraPermission()
  if (!hasPermission) {
    showCameraPermissionAlert()
  }
  return hasPermission
}
