import { writable, readable, derived } from 'svelte/store'

export const folks = writable({})

export const session = writable()

export const scribeStr = writable('')

export const requestedChanges = writable([])

export const recordedChanges = writable([])

export const committedChanges = writable([])

export const nextIndex = derived(
  recordedChanges,
  c => c.length
)
