"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { apiService } from "../services/api"
import { useAuth } from "../context/AuthContext"

interface VerificationScreenProps {
  navigation: any
  route: {
    params: {
      email: string
    }
  }
}

export default function VerificationScreen({ navigation, route }: VerificationScreenProps) {
  const { t } = useTranslation()
  const { email } = route.params
  const { checkVerificationStatus, logout } = useAuth()
  const [code, setCode] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  // Refs for input fields
  const inputRefs = useRef<Array<TextInput | null>>([])

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleCodeChange = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) return

    const newCode = [...code]
    newCode[index] = text

    setCode(newCode)

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-verify when all 4 digits are entered
    if (newCode.every((digit) => digit !== "") && index === 3) {
      handleVerify(newCode.join(""))
    }
  }

  const handleKeyPress = (e: any, index: number) => {
    // Auto-focus previous input on backspace
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join("")

    if (codeToVerify.length !== 4) {
      Alert.alert(t('common.error'), t('verification.error_enter_code'))
      return
    }

    setLoading(true)
    try {
      // Verify the email with the code
      await apiService.verifyEmail({ email, code: codeToVerify })
      
      // Update verification status in auth context
      const isVerified = await checkVerificationStatus()
      
      console.log("Verification successful, isVerified:", isVerified)
      
      // Show success message
      Alert.alert(
        t('common.success'),
        t('verification.success')
      )
      
      // The App.js will automatically navigate to Main screen
      // based on the updated needsVerification state
    } catch (error: any) {
      console.log("Verification error:", error)
      Alert.alert(t('common.error'), error.message || t('verification.error_invalid'))
      // Clear the code
      setCode(["", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!canResend) return

    setResendLoading(true)
    try {
      const response = await apiService.resendVerification(email)
      Alert.alert(t('common.success'), response.message || t('verification.success_resend'))
      
      // Reset countdown
      setCountdown(60)
      setCanResend(false)
      
      // Restart timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      console.log("Resend error:", error)
      console.log("Error details:", {
        message: error.message,
        toString: error.toString(),
      })
      
      // Show the actual error message from the backend
      Alert.alert(t('common.error'), error.message || t('verification.error_resend'))
    } finally {
      setResendLoading(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert(
      t('verification.sign_out_title'),
      t('verification.sign_out_confirm'),
      [
        {
          text: t('common.cancel'),
          style: "cancel",
        },
        {
          text: t('verification.sign_out'),
          style: "destructive",
          onPress: async () => {
            await logout()
            // Navigation will be handled automatically by App.js
          },
        },
      ]
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={60} color="#007AFF" />
          </View>

          <Text style={styles.title}>{t('verification.title')}</Text>
          <Text style={styles.subtitle}>
            {t('verification.subtitle')}{"\n"}
            <Text style={styles.email}>{email}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t('verification.label')}</Text>
          
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                // @ts-ignore
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => handleVerify()}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t('verification.verifying') : t('verification.verify_email')}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              {t('verification.didnt_receive')}{" "}
            </Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={!canResend || resendLoading}
            >
              <Text
                style={[
                  styles.resendButton,
                  (!canResend || resendLoading) && styles.resendButtonDisabled,
                ]}
              >
                {resendLoading
                  ? t('verification.sending')
                  : canResend
                  ? t('verification.resend_code')
                  : t('verification.resend_in', { countdown })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign Out Option */}
          <View style={styles.signOutContainer}>
            <Text style={styles.signOutText}>{t('verification.wrong_account')} </Text>
            <TouchableOpacity onPress={handleSignOut}>
              <Text style={styles.signOutButton}>{t('verification.sign_out')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
    textAlign: "center",
  },
  email: {
    fontWeight: "600",
    color: "#007AFF",
  },
  form: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  codeInput: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  codeInputFilled: {
    borderColor: "#007AFF",
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  resendText: {
    fontSize: 14,
    color: "#666",
  },
  resendButton: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  resendButtonDisabled: {
    color: "#999",
  },
  signOutContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  signOutText: {
    fontSize: 14,
    color: "#666",
  },
  signOutButton: {
    fontSize: 14,
    color: "#FF3B30",
    fontWeight: "600",
  },
})
