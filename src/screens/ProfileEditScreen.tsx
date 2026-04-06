import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { useAuth } from "../context/AuthContext"
import { apiService } from "../services/api"
import { useTranslation } from "react-i18next"

export default function ProfileEditScreen({ navigation }: any) {
  const { user, updateProfile } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const requestPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(t('common.error'), t('profileEdit.permission_denied'))
        return false
      }
    }
    return true
  }

  const pickImage = async () => {
    const hasPermission = await requestPermission()
    if (!hasPermission) return

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0])
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert(t('common.error'), t('profileEdit.error_pick_image'))
    }
  }

  const uploadAvatar = async (asset: any) => {
    try {
      setUploadingAvatar(true)
      
      const file = {
        uri: asset.uri,
        type: asset.type || "image/jpeg",
        name: asset.fileName || "avatar.jpg",
      }

      const response = await apiService.uploadAvatar(file)
      setProfileData({ ...profileData, avatar: response.avatarUrl })
      
      Alert.alert(t('common.success'), t('profileEdit.success_profile') + ' Avatar uploaded')
    } catch (error: any) {
      console.error("Error uploading avatar:", error)
      Alert.alert("Error", error.message || "Failed to upload avatar")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!profileData.name.trim()) {
      Alert.alert(t('common.error'), t('profileEdit.error_name_required'))
      return
    }

    try {
      setLoading(true)
      const success = await updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        avatar: profileData.avatar,
      })

      if (success) {
        Alert.alert(t('common.success'), t('profileEdit.success_profile'))
        navigation.goBack()
      } else {
        Alert.alert(t('common.error'), t('common.error'))
      }
    } catch (error: any) {
      console.error("Error updating profile:", error)
      Alert.alert("Error", error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

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
        Alert.alert(t('common.success'), t('profileEdit.success_password'))
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      }
    } catch (error: any) {
      console.error("Error changing password:", error)
      Alert.alert("Error", error.message || "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profileEdit.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Avatar Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profileEdit.profile_photo')}</Text>
        <View style={styles.avatarContainer}>
          {profileData.avatar ? (
            <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color="#999" />
            </View>
          )}
          <TouchableOpacity 
            style={styles.changeAvatarButton} 
            onPress={pickImage}
            disabled={uploadingAvatar}
          >
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {uploadingAvatar && <Text style={styles.uploadingText}>{t('profileEdit.uploading')}</Text>}
      </View>

      {/* Profile Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profileEdit.profile_info')}</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('profileEdit.email_label')}</Text>
          <View style={styles.inputDisabled}>
            <Text style={styles.inputDisabledText}>{user?.email}</Text>
            <Ionicons name="lock-closed" size={16} color="#999" />
          </View>
          <Text style={styles.helperText}>{t('profileEdit.email_locked')}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('profileEdit.name_label')}</Text>
          <TextInput
            style={styles.input}
            value={profileData.name}
            onChangeText={(text) => setProfileData({ ...profileData, name: text })}
            placeholder={t('profileEdit.name_placeholder')}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('profileEdit.phone_label')}</Text>
          <TextInput
            style={styles.input}
            value={profileData.phone}
            onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
            placeholder={t('profileEdit.phone_placeholder')}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? t('profileEdit.updating') : t('profileEdit.update')}</Text>
        </TouchableOpacity>
      </View>

      {/* Change Password Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profileEdit.change_password_title')}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('profileEdit.current_password')}</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.passwordField}
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
              placeholder={t('profileEdit.current_password_placeholder')}
              secureTextEntry={!showCurrentPassword}
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
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={20} color="#666" />
            </TouchableOpacity>
          </View>
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
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, loading && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? t('profileEdit.changing') : t('profileEdit.change')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  avatarContainer: {
    alignSelf: "center",
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  changeAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  uploadingText: {
    textAlign: "center",
    color: "#666",
    marginTop: 10,
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
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  inputDisabled: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f5f5f5",
  },
  inputDisabledText: {
    fontSize: 16,
    color: "#999",
  },
  helperText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  passwordInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  passwordField: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  buttonSecondary: {
    backgroundColor: "#34C759",
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
