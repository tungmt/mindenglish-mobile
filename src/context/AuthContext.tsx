"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { apiService } from "../services/api"
import type { User, UpdateProfileRequest } from "../types/api"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (data: { email: string; name: string; password: string; phone?: string }) => Promise<boolean>
  logout: () => Promise<void>
  updateProfile: (data: UpdateProfileRequest) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem("user")
      const token = await AsyncStorage.getItem("token")


      if (userData && token) {
        setUser(JSON.parse(userData))
        // Optionally refresh user data from API
        try {
          console.log("User data start from API")
          const freshUserData = await apiService.getUserProfile()
          setUser(freshUserData)
          console.log("User data refreshed from API")
          await AsyncStorage.setItem("user", JSON.stringify(freshUserData))
        } catch (error) {
          console.log("Could not refresh user data:", error)
        }
      }
    } catch (error) {
      console.error("Error checking auth state:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login({ email, password })
      setUser(response.user)
      await AsyncStorage.setItem("user", JSON.stringify(response.user))
      await AsyncStorage.setItem("token", response.token)
      return true
    } catch (error) {
      console.error("Error logging in:", error)
      return false
    }
  }

  const register = async (data: { email: string; name: string; password: string; phone?: string }): Promise<boolean> => {
    try {
      const response = await apiService.register(data)
      setUser(response.user)
      await AsyncStorage.setItem("user", JSON.stringify(response.user))
      await AsyncStorage.setItem("token", response.token)
      return true
    } catch (error) {
      console.error("Error registering:", error)
      return false
    }
  }

  const updateProfile = async (data: UpdateProfileRequest): Promise<boolean> => {
    try {
      const updatedUser = await apiService.updateProfile(data)
      setUser(updatedUser)
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser))
      return true
    } catch (error) {
      console.error("Error updating profile:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeMany(["user", "token"])
      setUser(null)
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
