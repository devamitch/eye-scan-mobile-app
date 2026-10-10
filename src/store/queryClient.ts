import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from "@react-native-community/netinfo"
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'

// ✅ Create query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours (should match maxAge below)
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        return failureCount < 3
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
})

// ✅ Create AsyncStorage persister
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
  throttleTime: 1000,
})


NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    queryClient.resumePausedMutations()
    queryClient.invalidateQueries()
  } else {
    queryClient.cancelQueries()
  }
})