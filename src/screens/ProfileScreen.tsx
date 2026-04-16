"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, Switch, Modal, Linking } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { useAuth } from "../context/AuthContext"
import { apiService } from "../services/api"

interface ProfileStats {
  totalListeningTime: number
  completedCourses: number
  currentStreak: number
  totalLessons: number
}

export default function ProfileScreen({ navigation }: any) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    totalListeningTime: 0,
    completedCourses: 0,
    currentStreak: 0,
    totalLessons: 0,
  })
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [languageModalVisible, setLanguageModalVisible] = useState(false)

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      const progressData = await apiService.getUserProgress()
      
      // Calculate stats from progress data
      const completedLessons = progressData.filter((p: any) => p.status === 'COMPLETED')
      
      // Count unique completed courses
      const uniqueCourses = new Set(
        completedLessons.map((p: any) => p.lesson?.module?.courseId).filter(Boolean)
      )
      
      const stats = {
        totalListeningTime: 0, // TODO: Calculate from listening history API
        completedCourses: uniqueCourses.size,
        currentStreak: 0, // TODO: Calculate streak from listening history
        totalLessons: completedLessons.length,
      }
      setProfileStats(stats)
    } catch (error) {
      console.log("Error loading profile data:", error)
      // Initialize with empty stats on error
      setProfileStats({
        totalListeningTime: 0,
        completedCourses: 0,
        currentStreak: 0,
        totalLessons: 0,
      })
    }
  }

  const handleLogout = () => {
    Alert.alert(t('profile.sign_out_title'), t('profile.sign_out_confirm'), [
      { text: t('common.cancel'), style: "cancel" },
      { text: t('profile.sign_out'), style: "destructive", onPress: logout },
    ])
  }

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
    setLanguageModalVisible(false)
  }

  const getLanguageDisplay = () => {
    return i18n.language === 'vi' ? t('profile.language_vi') : t('profile.language_en')
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.delete_title'),
      t('profile.delete_confirm'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: async () => {
            Alert.alert(t('common.ok'), t('profile.delete_not_available'))
          },
        },
      ],
    )
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const menuItems = [
    {
      icon: "settings-outline",
      title: t('profile.menu_settings'),
      subtitle: t('profile.menu_settings_sub'),
      onPress: () => navigation.navigate("Settings"),
    },
    {
      icon: "help-circle-outline",
      title: t('profile.menu_support'),
      subtitle: t('profile.menu_support_sub'),
      onPress: () => navigation.navigate("Support"),
    },
    // {
    //   icon: "document-text-outline",
    //   title: t('profile.menu_privacy'),
    //   subtitle: t('profile.menu_privacy_sub'),
    //   onPress: () => { 
    //     Linking.openURL("https://mindenglish.vn/privacy-policy")
    //    },
    // },
    // {
    //   icon: "shield-checkmark-outline",
    //   title: t('profile.menu_terms'),
    //   subtitle: t('profile.menu_terms_sub'),
    //   onPress: () => {
    //     // Navigate to terms of service or open web view
    //     console.log("Open terms of service")
    //   },
    // },
    // {
    //   icon: "star-outline",
    //   title: t('profile.menu_rate'),
    //   subtitle: t('profile.menu_rate_sub'),
    //   onPress: () => { console.log("Open app store rating") },
    // },
    // {
    //   icon: "share-outline",
    //   title: t('profile.menu_share'),
    //   subtitle: t('profile.menu_share_sub'),
    //   onPress: () => { console.log("Share app") },
    // },
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      </View>

      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: user?.avatar || "/placeholder.svg?height=80&width=80&text=User",
            }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={16} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || "User"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <TouchableOpacity style={styles.editProfileButton}>
          <Ionicons name="pencil" size={16} color="#007AFF" />
          <Text style={styles.editProfileText}>{t('common.edit')}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>{t('profile.learning_stats')}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{formatTime(profileStats.totalListeningTime)}</Text>
            <Text style={styles.statLabel}>{t('profile.total_time')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="book-outline" size={24} color="#34C759" />
            <Text style={styles.statNumber}>{profileStats.completedCourses}</Text>
            <Text style={styles.statLabel}>{t('profile.courses')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color="#FF9500" />
            <Text style={styles.statNumber}>{profileStats.currentStreak}</Text>
            <Text style={styles.statLabel}>{t('profile.day_streak')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#FF3B30" />
            <Text style={styles.statNumber}>{profileStats.totalLessons}</Text>
            <Text style={styles.statLabel}>{t('profile.lessons')}</Text>
          </View>
        </View>
      </View>

      {/* Quick Settings */}
      <View style={styles.section}>
        {/* <Text style={styles.sectionTitle}>{t('profile.quick_settings')}</Text> */}
        
        {/* Notifications Toggle */}
        {/* <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications-outline" size={20} color="#666" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{t('profile.push_notifications')}</Text>
              <Text style={styles.settingSubtitle}>{t('profile.reminders')}</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#e0e0e0", true: "#007AFF" }}
            thumbColor={notificationsEnabled ? "white" : "#f4f3f4"}
          />
        </View> */}

        {/* Language Picker */}
        <TouchableOpacity 
          style={[styles.settingItem, { marginTop: 10 }]} 
          onPress={() => setLanguageModalVisible(true)}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="language-outline" size={20} color="#666" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{t('profile.language')}</Text>
              <Text style={styles.settingSubtitle}>{getLanguageDisplay()}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.more')}</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon as any} size={20} color="#666" />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>{t('profile.sign_out')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount} disabled={loading}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteText}>{loading ? t('profile.deleting') : t('profile.delete_account')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('profile.version')}</Text>
        <Text style={styles.footerText}>{t('profile.made_with')}</Text>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.language_select')}</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.languageOption, i18n.language === 'en' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('en')}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.languageText}>🇺🇸 {t('profile.language_en')}</Text>
              </View>
              {i18n.language === 'en' && (
                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.languageOption, i18n.language === 'vi' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('vi')}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.languageText}>🇻🇳 {t('profile.language_vi')}</Text>
              </View>
              {i18n.language === 'vi' && (
                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f8ff",
  },
  editProfileText: {
    color: "#007AFF",
    fontSize: 14,
    marginLeft: 4,
  },
  statsSection: {
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
    marginHorizontal: "1%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  logoutText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff5f5",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  deleteText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    marginBottom: 10,
  },
  languageOptionActive: {
    backgroundColor: "#e3f2fd",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  languageInfo: {
    flex: 1,
  },
  languageText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
})
