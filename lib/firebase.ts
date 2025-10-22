import { initializeApp } from "firebase/app"
import { getDatabase } from "firebase/database"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage" // Import getStorage

const firebaseConfig = {
  apiKey: "AIzaSyAaXU9mr5On11bA5ilEGHh27bPiDX6Um0Q",
  authDomain: "suugii4466-70a06.firebaseapp.com",
  databaseURL: "https://suugii4466-70a06-default-rtdb.firebaseio.com",
  projectId: "suugii4466-70a06",
  storageBucket: "suugii4466-70a06.firebasestorage.app",
  messagingSenderId: "451186567811",
  appId: "1:451186567811:web:036d278781f61dae74c9b6",
  measurementId: "G-36K67LKQBC",
}

const app = initializeApp(firebaseConfig)
export const database = getDatabase(app)
export const auth = getAuth(app)
export const storage = getStorage(app) // Export storage
