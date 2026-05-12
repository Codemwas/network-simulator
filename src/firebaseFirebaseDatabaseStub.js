// Stub for @firebase/database to prevent Firebase RTDB from crashing
// when Firebase config is missing/placeholder.
export const getDatabase = () => null
export const ref = () => null
export const onValue = () => () => {}
export const off = () => {}
export const set = () => Promise.resolve()
export const push = () => null
export const update = () => Promise.resolve()
