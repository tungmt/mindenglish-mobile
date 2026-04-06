"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

interface LeaderboardUser {
  id: string
  name: string
  avatar: string
  listeningTime: number // in minutes
  completedLessons: number
  streak: number
  rank: number
}

interface PopularAudio {
  id: string
  title: string
  thumbnail: string
  listenerCount: number
  category: string
  duration: number
}

interface CommunityStats {
  totalUsers: number
  totalListeningTime: number
  mostPopularCategory: string
  averageSessionTime: number
}

export default function CommunityScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"leaderboard" | "popular">("leaderboard")
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [popularAudios, setPopularAudios] = useState<PopularAudio[]>([])
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCommunityData()
  }, [])

  const loadCommunityData = async () => {
    try {
      setLoading(true)
      
      // TODO: Backend APIs needed for community features:
      // 1. GET /api/community/leaderboard - Returns top users by listening time/lessons completed
      // 2. GET /api/community/popular - Returns most popular lessons/courses by listener count
      // 3. GET /api/community/stats - Returns overall community statistics
      // Until these endpoints are created, using empty data
      
      console.warn("CommunityScreen: Backend APIs for leaderboard and popular content not yet implemented")
      
      setLeaderboard([])
      setPopularAudios([])
      setCommunityStats(null)
    } catch (error) {
      console.error("Error loading community data:", error)
      setLeaderboard([])
      setPopularAudios([])
      setCommunityStats(null)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000)
    return `${minutes}m`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Ionicons name="trophy" size={20} color="#FFD700" />
      case 2:
        return <Ionicons name="medal" size={20} color="#C0C0C0" />
      case 3:
        return <Ionicons name="medal" size={20} color="#CD7F32" />
      default:
        return <Text style={styles.rankNumber}>{rank}</Text>
    }
  }

  const renderLeaderboardItem = ({ item: user }: { item: LeaderboardUser }) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>{getRankIcon(user.rank)}</View>

      <Image source={{ uri: user.avatar }} style={styles.userAvatar} />

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <View style={styles.userStats}>
          <View style={styles.userStat}>
            <Ionicons name="time-outline" size={12} color="#666" />
            <Text style={styles.userStatText}>{formatTime(user.listeningTime)}</Text>
          </View>
          <View style={styles.userStat}>
            <Ionicons name="checkmark-circle-outline" size={12} color="#666" />
            <Text style={styles.userStatText}>{t('community.lessons_unit', { count: user.completedLessons })}</Text>
          </View>
          <View style={styles.userStat}>
            <Ionicons name="flame" size={12} color="#FF9500" />
            <Text style={styles.userStatText}>{t('community.days_unit', { count: user.streak })}</Text>
          </View>
        </View>
      </View>
    </View>
  )

  const renderPopularAudio = ({ item: audio }: { item: PopularAudio }) => (
    <TouchableOpacity style={styles.popularAudioItem}>
      <Image source={{ uri: audio.thumbnail }} style={styles.audioThumbnail} />

      <View style={styles.audioInfo}>
        <Text style={styles.audioTitle} numberOfLines={2}>
          {audio.title}
        </Text>
        <View style={styles.audioMeta}>
          <Text style={styles.audioCategory}>{audio.category}</Text>
          <Text style={styles.audioDuration}>{formatDuration(audio.duration)}</Text>
        </View>
        <View style={styles.audioStats}>
          <Ionicons name="headset" size={14} color="#007AFF" />
          <Text style={styles.listenerCount}>{t('community.listeners', { count: audio.listenerCount.toLocaleString() })}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.playButton}>
        <Ionicons name="play" size={16} color="#007AFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('community.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Community Stats */}
      {communityStats && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>{t('community.stats_title')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={24} color="#007AFF" />
              <Text style={styles.statNumber}>{communityStats.totalUsers.toLocaleString()}</Text>
              <Text style={styles.statLabel}>{t('community.members')}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color="#34C759" />
              <Text style={styles.statNumber}>{communityStats.totalListeningTime.toLocaleString()}h</Text>
              <Text style={styles.statLabel}>{t('community.total_hours')}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up-outline" size={24} color="#FF9500" />
              <Text style={styles.statNumber}>{communityStats.mostPopularCategory}</Text>
              <Text style={styles.statLabel}>{t('community.most_popular')}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "leaderboard" && styles.activeTab]}
          onPress={() => setActiveTab("leaderboard")}
        >
          <Text style={[styles.tabText, activeTab === "leaderboard" && styles.activeTabText]}>{t('community.leaderboard')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "popular" && styles.activeTab]}
          onPress={() => setActiveTab("popular")}
        >
          <Text style={[styles.tabText, activeTab === "popular" && styles.activeTabText]}>{t('community.popular')}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "leaderboard" ? (
          <FlatList
            data={leaderboard}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <FlatList
            data={popularAudios}
            renderItem={renderPopularAudio}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
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
  statsSection: {
    marginBottom: 20,
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
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "white",
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rankContainer: {
    width: 30,
    alignItems: "center",
    marginRight: 15,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  userStats: {
    flexDirection: "row",
  },
  userStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  userStatText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 2,
  },
  popularAudioItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  audioThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  audioMeta: {
    flexDirection: "row",
    marginBottom: 6,
  },
  audioCategory: {
    fontSize: 12,
    color: "#007AFF",
    marginRight: 10,
  },
  audioDuration: {
    fontSize: 12,
    color: "#666",
  },
  audioStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  listenerCount: {
    fontSize: 12,
    color: "#007AFF",
    marginLeft: 4,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
  },
})
