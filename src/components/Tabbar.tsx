import React from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import { useTranslation } from "react-i18next"

const { width } = Dimensions.get("window")

interface TabItem {
  name: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  iconFocused: keyof typeof Ionicons.glyphMap
}

const tabs: TabItem[] = [
  {
    name: "Home",
    label: "Home",
    icon: "home-outline",
    iconFocused: "home",
  },
  {
    name: "Library",
    label: "Library",
    icon: "library-outline",
    iconFocused: "library",
  },
  {
    name: "Profile",
    label: "Profile",
    icon: "person-outline",
    iconFocused: "person",
  },
]

const Tabbar: React.FC<BottomTabBarProps> = ({ navigation, state }) => {
  const { t } = useTranslation()
  const currentIndex = state.index

  const tabsLocalized: TabItem[] = [
    { name: "Home", label: t('tabbar.home'), icon: "home-outline", iconFocused: "home" },
    { name: "Library", label: t('tabbar.library'), icon: "library-outline", iconFocused: "library" },
    { name: "Profile", label: t('tabbar.profile'), icon: "person-outline", iconFocused: "person" },
  ]

  const handleTabPress = (routeName: string, index: number) => {
    if (currentIndex !== index) {
      navigation.navigate(routeName)
    }
  }

  return (
    <View style={styles.container}>
      {tabsLocalized.map((tab, index) => {
        const isFocused = currentIndex === index
        const route = state.routes[index]

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => handleTabPress(route.name, index)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFocused ? tab.iconFocused : tab.icon}
              size={24}
              color={isFocused ? "#007AFF" : "#8E8E93"}
            />
            <Text
              style={[
                styles.tabLabel,
                isFocused && styles.tabLabelFocused,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingTop: 10,
    paddingHorizontal: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8E8E93",
  },
  tabLabelFocused: {
    color: "#007AFF",
    fontWeight: "600",
  },
})

export default Tabbar
