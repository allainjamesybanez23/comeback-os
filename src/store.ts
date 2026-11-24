import { useEffect, useRef, useState } from 'react'
import { fresh, type State } from './model'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('comeback-os', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('data')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function useStore() {
  const [state, setState] = useState<State>()
  const [error, setError] = useState('')
  const handle = useRef<IDBDatabase>(null)
  const current = useRef<State>(null)
  useEffect(() => {
    let mounted = true
    openDb().then(db => {
      if (!mounted) { db.close(); return }
      handle.current = db
      const request = db.transaction('data').objectStore('data').get('program')
      request.onsuccess = () => {
        if (!mounted) return
        const data = request.result as State | undefined
        if (data && data.version !== 1) {
          setError('This data was written by a different app version.')
          return
        }
        current.current = { ...fresh, ...data }
        setState(current.current)
      }
      request.onerror = () => setError('The workout database could not be read.')
    }).catch(() => setError('The workout database could not be opened.'))
    return () => { mounted = false; handle.current?.close(); handle.current = null }
  }, [])
  function update(change: (before: State) => State) {
    if (!current.current || !handle.current) return
    const next = change(current.current)
    try {
      const transaction = handle.current.transaction('data', 'readwrite', { durability: 'strict' })
      transaction.objectStore('data').put(next, 'program')
      transaction.oncomplete = () => setError('')
      transaction.onabort = () => setError('Changes could not be saved. Check available disk space before closing.')
      current.current = next
      setState(next)
    } catch {
      setError('Changes could not be saved. Reopen the app and try again.')
    }
  }
  return { state, update, error }
}
export type Update = ReturnType<typeof useStore>['update']

declare global {
  interface Window {
    desktop?: {
      keepAwake(enabled: boolean): void
      backgroundKeys(enabled: boolean): void
      onWorkoutKey(callback: (key: string) => void): () => void
      onWorkoutKeyError(callback: () => void): () => void
    }
  }
}
