import { NetworkState } from '../types'
import NetInfo from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'

export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: null,
    isInternetReachable: null,
    type: 'unknown',
  })

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      })
    })

    // Get initial state
    NetInfo.fetch().then((state) => {
      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      })
    })

    return unsubscribe
  }, [])

  return networkState
}
