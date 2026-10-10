import { OfflineCache } from '../types'
import { useCallback, useState } from 'react'
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()

const CACHE_KEYS = {
  OFFLINE_PAGES: 'offline_pages',
  CACHE_TIMESTAMP: 'cache_timestamp',
}

export const useOfflineCache = () => {
  const [cachedPages, setCachedPages] = useState<Record<string, OfflineCache>>({})

  const loadCachedPages = useCallback(() => {
    try {
      const cached = storage.getString(CACHE_KEYS.OFFLINE_PAGES)
      if (cached) {
        setCachedPages(JSON.parse(cached))
      }
    } catch (error) {
      console.error('Error loading cached pages:', error)
    }
  }, [])

  const savePageToCache = useCallback(
    (url: string, html: string, title: string) => {
      try {
        const cacheEntry: OfflineCache = {
          url,
          html,
          title,
          timestamp: Date.now(),
        }

        const updatedCache = {
          ...cachedPages,
          [url]: cacheEntry,
        }

        // Keep only last 10 pages to avoid storage issues
        const entries = Object.entries(updatedCache)
        if (entries.length > 10) {
          const sorted = entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
          sorted.length = 10
          updatedCache = Object.fromEntries(sorted)
        }

        storage.set(CACHE_KEYS.OFFLINE_PAGES, JSON.stringify(updatedCache))
        setCachedPages(updatedCache)
      } catch (error) {
        console.error('Error saving page to cache:', error)
      }
    },
    [cachedPages],
  )

  const getCachedPage = useCallback(
    (url: string): OfflineCache | null => {
      return cachedPages[url] || null
    },
    [cachedPages],
  )

  const clearCache = useCallback(() => {
    storage.delete(CACHE_KEYS.OFFLINE_PAGES)
    setCachedPages({})
  }, [])

  return {
    cachedPages,
    loadCachedPages,
    savePageToCache,
    getCachedPage,
    clearCache,
  }
}
