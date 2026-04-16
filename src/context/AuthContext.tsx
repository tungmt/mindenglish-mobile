"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { apiService } from "../services/api"
import type { User, UpdateProfileRequest } from "../types/api"

interface AuthContextType {
  user: User | null
  loading: boolean
  needsVerification: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (data: { email: string; name: string; password: string; phone?: string }) => Promise<{ success: boolean; needsVerification: boolean }>
  logout: () => Promise<void>
  updateProfile: (data: UpdateProfileRequest) => Promise<boolean>
  checkVerificationStatus: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsVerification, setNeedsVerification] = useState(false)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem("user")
      const token = await AsyncStorage.getItem("token")


      if (userData && token) {
        const parsedUser = JSON.parse(userData)
        
        // Always fetch fresh user data from API first
        try {
          console.log("Fetching fresh user data from API...")
          const freshUserData = await apiService.getUserProfile()
          setUser(freshUserData)
          console.log("User data refreshed from API, isEmailVerified:", freshUserData.isEmailVerified)
          await AsyncStorage.setItem("user", JSON.stringify(freshUserData))
          
          // Update verification status based on fresh data
          setNeedsVerification(!freshUserData.isEmailVerified)
        } catch (error: any) {
          console.log("Could not refresh user data:", error)
          
          // If unauthorized, token is invalid - clear auth data
          if (error.message === "Unauthorized") {
            console.log("Token is invalid, clearing auth data...")
            await AsyncStorage.removeMany(["user", "token"])
            setUser(null)
            setNeedsVerification(false)
          } else {
            // For other errors, fallback to cached data
            setUser(parsedUser)
            setNeedsVerification(!parsedUser.isEmailVerified)
          }
        }
      }
    } catch (error) {
      console.log("Error checking auth state:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkVerificationStatus = async (): Promise<boolean> => {
    try {
      const freshUserData = await apiService.getUserProfile()
      setUser(freshUserData)
      await AsyncStorage.setItem("user", JSON.stringify(freshUserData))
      
      const isVerified = freshUserData.isEmailVerified
      setNeedsVerification(!isVerified)
      return isVerified
    } catch (error) {
      console.log("Error checking verification status:", error)
      return false
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login({ email, password })
      setUser(response.user)
      await AsyncStorage.setItem("user", JSON.stringify(response.user))
      await AsyncStorage.setItem("token", response.token)
      
      // Check if email verification is needed
      if (!response.user.isEmailVerified) {
        setNeedsVerification(true)
      }
      
      return true
    } catch (error) {
      console.log("Error logging in:", error)
      return false
    }
  }

  const register = async (data: { email: string; name: string; password: string; phone?: string }): Promise<{ success: boolean; needsVerification: boolean }> => {
    try {
      const response = await apiService.register(data)
      setUser(response.user)
      await AsyncStorage.setItem("user", JSON.stringify(response.user))
      await AsyncStorage.setItem("token", response.token)
      
      // Check if email verification is needed
      const needsVerify = !response.user.isEmailVerified
      setNeedsVerification(needsVerify)
      
      return { success: true, needsVerification: needsVerify }
    } catch (error) {
      console.log("Error registering:", error)
      return { success: false, needsVerification: false }
    }
  }

  const updateProfile = async (data: UpdateProfileRequest): Promise<boolean> => {
    try {
      const updatedUser = await apiService.updateProfile(data)
      setUser(updatedUser)
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser))
      return true
    } catch (error) {
      console.log("Error updating profile:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeMany(["user", "token"])
      setUser(null)
      setNeedsVerification(false)
    } catch (error) {
      console.log("Error logging out:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsVerification,
        login,
        register,
        logout,
        updateProfile,
        checkVerificationStatus,
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
