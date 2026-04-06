"use client"

import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

export default function SettingsScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [settings, setSettings] = useState({
    notifications: true,
    autoDownload: false,
    wifiOnly: true,
    darkMode: false,
    defaultSpeed: "1.0x",
  })

  const playbackSpeeds = ["0.5x", "0.75x", "1.0x", "1.25x", "1.5x", "1.75x", "2.0x"]

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Audio Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.audio')}</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('settings.playback_speed')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {playbackSpeeds.map((speed) => (
                <TouchableOpacity
                  key={speed}
                  style={[styles.speedButton, settings.defaultSpeed === speed && styles.speedButtonActive]}
                  onPress={() => updateSetting("defaultSpeed", speed)}
                >
                  <Text style={[styles.speedText, settings.defaultSpeed === speed && styles.speedTextActive]}>
                    {speed}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Download Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.download')}</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.auto_download')}</Text>
              <Text style={styles.settingSubtitle}>{t('settings.auto_download_sub')}</Text>
            </View>
            <Switch value={settings.autoDownload} onValueChange={(value) => updateSetting("autoDownload", value)} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.wifi_only')}</Text>
              <Text style={styles.settingSubtitle}>{t('settings.wifi_only_sub')}</Text>
            </View>
            <Switch value={settings.wifiOnly} onValueChange={(value) => updateSetting("wifiOnly", value)} />
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.push_notifications')}</Text>
              <Text style={styles.settingSubtitle}>{t('settings.push_sub')}</Text>
            </View>
            <Switch value={settings.notifications} onValueChange={(value) => updateSetting("notifications", value)} />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.app_settings')}</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('settings.dark_mode')}</Text>
              <Text style={styles.settingSubtitle}>{t('settings.dark_mode_sub')}</Text>
            </View>
            <Switch value={settings.darkMode} onValueChange={(value) => updateSetting("darkMode", value)} />
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  settingItem: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  speedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  speedButtonActive: {
    backgroundColor: "#007AFF",
  },
  speedText: {
    fontSize: 14,
    color: "#666",
  },
  speedTextActive: {
    color: "white",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
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
})
