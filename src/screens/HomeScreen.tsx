"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { useAudio } from "../context/AudioContext"
import { apiService } from "../services/api"

const { width } = Dimensions.get("window")

interface RecentAudio {
  id: string
  title: string
  courseName: string
  duration: number
  progress: number
  thumbnail: string
}

interface TodayStats {
  listeningTime: number
  completedLessons: number
  streak: number
}

interface PopularAudio {
  id: string
  title: string
  listenerCount: number
  thumbnail: string
}

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth()
  const { currentTrack, playTrack } = useAudio()
  const [recentAudios, setRecentAudios] = useState<RecentAudio[]>([])
  const [todayStats, setTodayStats] = useState<TodayStats>({
    listeningTime: 0,
    completedLessons: 0,
    streak: 0,
  })
  const [popularAudios, setPopularAudios] = useState<PopularAudio[]>([])
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    loadHomeData()
    checkForCelebration()
  }, [])

  const loadHomeData = async () => {
    try {
      // Load user progress for recent listening
      const progressData = await apiService.getUserProgress()
      
      // Get recent lessons with progress
      const recentLessonsWithProgress = (progressData || [])
        .filter((p: any) => p.status === 'IN_PROGRESS' || p.currentTime > 0)
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3)
      
      // Load lesson details and course info for recent items
      const recentAudiosData = await Promise.all(
        recentLessonsWithProgress.map(async (progress: any) => {
          try {
            const lesson: any = await apiService.getLessonById(progress.lessonId)
            let courseName = 'Unknown'
            
            // Get course name from module relationship
            if (lesson.module?.course) {
              courseName = lesson.module.course.title
            } else if (lesson.chapter?.audioBook) {
              courseName = lesson.chapter.audioBook.title
            }
            
            return {
              id: lesson.id,
              title: lesson.title,
              courseName: courseName,
              duration: (lesson.duration || 0) * 1000, // Convert to milliseconds
              progress: lesson.duration ? (progress.currentTime || 0) / lesson.duration : 0,
              thumbnail: lesson.coverImage || lesson.avatar || '/placeholder.svg',
            }
          } catch (err) {
            console.error('Error loading lesson:', err)
            return null
          }
        })
      )
      
      setRecentAudios(recentAudiosData.filter(Boolean) as RecentAudio[])

      // Calculate today's stats from progress
      const completedToday = (progressData || []).filter((p: any) => {
        const completedDate = new Date(p.completedAt)
        const today = new Date()
        return p.status === 'COMPLETED' && 
               completedDate.toDateString() === today.toDateString()
      }).length

      setTodayStats({
        listeningTime: 0, // TODO: Calculate from listening stats API
        completedLessons: completedToday,
        streak: 0, // TODO: Calculate streak from listening stats
      })

      // Load popular courses
      const coursesResponse = await apiService.getCourses({ page: 1, limit: 5 })
      const popularAudiosData = (coursesResponse.courses || []).slice(0, 3).map((course: any) => ({
        id: course.id,
        title: course.title,
        listenerCount: course._count?.favorites || 0,
        thumbnail: course.coverImage || course.avatar || '/placeholder.svg',
      }))
      
      setPopularAudios(popularAudiosData)
    } catch (error) {
      console.error("Error loading home data:", error)
      // Initialize with empty data on error
      setRecentAudios([])
      setTodayStats({ listeningTime: 0, completedLessons: 0, streak: 0 })
      setPopularAudios([])
    }
  }

  const checkForCelebration = () => {
    // Check if user just completed a lesson
    const lastCompletedLesson = "Ngày 4"
    if (lastCompletedLesson) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    const name = user?.name || "Thảo"

    if (hour < 12) return `Chào buổi sáng, ${name}!`
    if (hour < 18) return `Chào buổi chiều, ${name}!`
    return `Chào buổi tối, ${name}!`
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

  const renderRecentAudio = (audio: RecentAudio) => (
    <TouchableOpacity key={audio.id} style={styles.recentAudioCard}>
      <Image source={{ uri: audio.thumbnail }} style={styles.recentAudioImage} />
      <View style={styles.recentAudioInfo}>
        <Text style={styles.recentAudioTitle} numberOfLines={2}>
          {audio.title}
        </Text>
        <Text style={styles.recentAudioCourse}>{audio.courseName}</Text>
        <View style={styles.recentAudioMeta}>
          <Text style={styles.recentAudioDuration}>{formatDuration(audio.duration)}</Text>
          <View style={styles.recentAudioProgress}>
            <View style={[styles.recentAudioProgressFill, { width: `${audio.progress * 100}%` }]} />
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.recentAudioPlayButton}>
        <Ionicons name="play" size={16} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  const renderPopularAudio = (audio: PopularAudio) => (
    <TouchableOpacity key={audio.id} style={styles.popularAudioItem}>
      <Image source={{ uri: audio.thumbnail }} style={styles.popularAudioImage} />
      <View style={styles.popularAudioInfo}>
        <Text style={styles.popularAudioTitle} numberOfLines={1}>
          {audio.title}
        </Text>
        <Text style={styles.popularAudioListeners}>{audio.listenerCount} người đang nghe</Text>
      </View>
      <Ionicons name="trending-up" size={16} color="#FF9500" />
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Celebration Modal */}
      {showCelebration && (
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationModal}>
            <Ionicons name="trophy" size={60} color="#FFD700" />
            <Text style={styles.celebrationTitle}>Chúc mừng!</Text>
            <Text style={styles.celebrationText}>Bạn đã hoàn thành Ngày 4</Text>
            <TouchableOpacity style={styles.celebrationButton} onPress={() => setShowCelebration(false)}>
              <Text style={styles.celebrationButtonText}>Tiếp tục</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Header with Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subtitle}>Hôm nay bạn muốn học gì?</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Continue Listening */}
      {currentTrack && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tiếp tục nghe</Text>
          <TouchableOpacity style={styles.continueCard} onPress={() => navigation.navigate("AudioPlayer")}>
            <Image
              source={{
                uri: `/placeholder.svg?height=60&width=60&text=${encodeURIComponent(currentTrack.title.slice(0, 3))}`,
              }}
              style={styles.continueImage}
            />
            <View style={styles.continueInfo}>
              <Text style={styles.continueTitle}>{currentTrack.title}</Text>
              <Text style={styles.continueSubtitle}>Chạm để tiếp tục</Text>
            </View>
            <View style={styles.continueButton}>
              <Ionicons name="play" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Today's Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tiến độ hôm nay</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{formatTime(todayStats.listeningTime)}</Text>
            <Text style={styles.statLabel}>Đã nghe</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#34C759" />
            <Text style={styles.statNumber}>{todayStats.completedLessons}</Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame-outline" size={24} color="#FF9500" />
            <Text style={styles.statNumber}>{todayStats.streak}</Text>
            <Text style={styles.statLabel}>Chuỗi ngày</Text>
          </View>
        </View>
      </View>

      {/* Recent Listening */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nghe gần đây</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Library")}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        {recentAudios.map(renderRecentAudio)}
      </View>

      {/* Popular in Community */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Phổ biến trong cộng đồng</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Community")}>
            <Text style={styles.seeAllText}>Xem thêm</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.popularContainer}>{popularAudios.map(renderPopularAudio)}</View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Khám phá</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("Library")}>
            <Ionicons name="library-outline" size={32} color="#007AFF" />
            <Text style={styles.quickActionTitle}>Thư viện</Text>
            <Text style={styles.quickActionSubtitle}>Tất cả audio books</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("Progress")}>
            <Ionicons name="analytics-outline" size={32} color="#34C759" />
            <Text style={styles.quickActionTitle}>Tiến độ</Text>
            <Text style={styles.quickActionSubtitle}>Theo dõi học tập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  celebrationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  celebrationModal: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginHorizontal: 40,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
    marginBottom: 10,
  },
  celebrationText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  celebrationButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  celebrationButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  seeAllText: {
    color: "#007AFF",
    fontSize: 16,
  },
  continueCard: {
    backgroundColor: "#007AFF",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  continueImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  continueInfo: {
    flex: 1,
  },
  continueTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  continueSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginTop: 4,
  },
  continueButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  recentAudioCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentAudioImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  recentAudioInfo: {
    flex: 1,
  },
  recentAudioTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  recentAudioCourse: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  recentAudioMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  recentAudioDuration: {
    fontSize: 12,
    color: "#999",
    marginRight: 10,
  },
  recentAudioProgress: {
    flex: 1,
    height: 2,
    backgroundColor: "#e0e0e0",
    borderRadius: 1,
  },
  recentAudioProgressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 1,
  },
  recentAudioPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
  },
  popularContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularAudioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  popularAudioImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  popularAudioInfo: {
    flex: 1,
  },
  popularAudioTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  popularAudioListeners: {
    fontSize: 12,
    color: "#666",
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
})
