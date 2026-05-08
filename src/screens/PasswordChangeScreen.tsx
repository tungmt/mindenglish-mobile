import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { apiService } from "../services/api"
import { useTranslation } from "react-i18next"

export default function PasswordChangeScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)



  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      Alert.alert(t('common.error'), t('profileEdit.error_fill_password'))
      return
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert(t('common.error'), t('profileEdit.error_password_length'))
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert(t('common.error'), t('profileEdit.error_passwords_match'))
      return
    }

    try {
      setLoading(true)
      const response = await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      if (response.success) {
        Alert.alert(
          t('common.success'),
          t('profileEdit.success_password'),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.goBack(),
            },
          ]
        )
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      }
    } catch (error: any) {
      console.log("Error changing password:", error)
      Alert.alert("Error", error.message || "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profileEdit.change_password_title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              {t('profileEdit.password_info') || 'Your new password must be at least 6 characters long.'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profileEdit.current_password')}</Text>
            <View style={styles.passwordInput}>
              <TextInput
                style={styles.passwordField}
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                placeholder={t('profileEdit.current_password_placeholder')}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Ionicons name={showCurrentPassword ? "eye-off" : "eye"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profileEdit.new_password')}</Text>
            <View style={styles.passwordInput}>
              <TextInput
                style={styles.passwordField}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                placeholder={t('profileEdit.new_password_placeholder')}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
            {passwordData.newPassword && passwordData.newPassword.length < 6 && (
              <Text style={styles.errorText}>{t('profileEdit.error_password_length')}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profileEdit.confirm_password')}</Text>
            <View style={styles.passwordInput}>
              <TextInput
                style={styles.passwordField}
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                placeholder={t('profileEdit.confirm_password_placeholder')}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#666" />
              </TouchableOpacity>
            </View>
            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
              <Text style={styles.errorText}>{t('profileEdit.error_passwords_match')}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t('profileEdit.changing') : t('profileEdit.change')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F4FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#007AFF",
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  passwordInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  passwordField: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    fontSize: 12,
    color: "#FF3B30",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
