"use client"

import { useState } from "react"
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

type Step = "email" | "verification"

export default function ForgotPasswordScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('forgotPassword.error_enter_email'))
      return
    }

    if (!validateEmail(email)) {
      Alert.alert(t('common.error'), t('forgotPassword.error_valid_email'))
      return
    }

    setLoading(true)
    try {
      const response = await apiService.sendVerificationCode(email)
      Alert.alert(
        t('common.success'),
        response.message || t('forgotPassword.success_send'),
        [{ text: t('common.ok'), onPress: () => setStep("verification") }]
      )
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('forgotPassword.error_enter_email'))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!verificationCode.trim()) {
      Alert.alert(t('common.error'), t('forgotPassword.error_enter_code'))
      return
    }

    if (verificationCode.length !== 6) {
      Alert.alert(t('common.error'), t('forgotPassword.error_code_length'))
      return
    }

    if (!newPassword.trim()) {
      Alert.alert(t('common.error'), t('forgotPassword.error_enter_new_password'))
      return
    }

    if (newPassword.length < 8) {
      Alert.alert(t('common.error'), t('forgotPassword.error_password_length'))
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('forgotPassword.error_passwords_match'))
      return
    }

    setLoading(true)
    try {
      const response = await apiService.resetPassword({ email, code: verificationCode, newPassword })
      Alert.alert(
        t('common.success'),
        response.message || t('forgotPassword.success_reset'),
        [{ text: t('common.ok'), onPress: () => navigation.navigate("Auth") }]
      )
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('forgotPassword.error_enter_code'))
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    try {
      const response = await apiService.sendVerificationCode(email)
      Alert.alert(t('common.success'), t('forgotPassword.success_resend'))
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('forgotPassword.error_enter_email'))
    } finally {
      setLoading(false)
    }
  }

  const renderEmailStep = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('forgotPassword.title_email')}</Text>
        <Text style={styles.subtitle}>{t('forgotPassword.subtitle_email')}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('forgotPassword.email_placeholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendCode}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? t('forgotPassword.sending') : t('forgotPassword.send_code')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Auth")}>
          <Text style={styles.backButtonText}>{t('forgotPassword.back_to_signin')}</Text>
        </TouchableOpacity>
      </View>
    </>
  )

  const renderVerificationStep = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep("email")}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('forgotPassword.title_verify')}</Text>
        <Text style={styles.subtitle}>
          {t('forgotPassword.subtitle_verify', { email })}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="shield-checkmark" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('forgotPassword.code_placeholder')}
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('forgotPassword.new_password')}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('forgotPassword.confirm_password')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.passwordHint}>{t('forgotPassword.password_hint')}</Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? t('forgotPassword.resetting') : t('forgotPassword.reset')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleResendCode} 
          disabled={loading}
          style={styles.resendContainer}
        >
          <Text style={styles.resendText}>{t('forgotPassword.resend_prefix')} </Text>
          <Text style={styles.resendLink}>{t('forgotPassword.resend')}</Text>
        </TouchableOpacity>
      </View>
    </>
  )

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === "email" ? renderEmailStep() : renderVerificationStep()}
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
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  form: {
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  passwordHint: {
    fontSize: 12,
    color: "#666",
    marginTop: -10,
    marginBottom: 20,
    paddingHorizontal: 5,
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
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
    textAlign: "center",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: {
    color: "#666",
    fontSize: 14,
  },
  resendLink: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
})
