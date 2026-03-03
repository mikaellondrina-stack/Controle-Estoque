import { signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from './firebase'

export async function signOut() {
  await firebaseSignOut(auth)
  document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

export function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        unsubscribe()
        resolve(user)
      },
      reject
    )
  })
}
