"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { apiService } from "../services/api"
import { useAuth } from "../context/AuthContext"

const { width } = Dimensions.get("window")

interface ProgressSummary {
  totalListeningTime: number
  completedLessons: number
  inProgressLessons: number
  totalCourses: number
  completedCourses: number
  currentStreak: number
  longestStreak: number
  activeDays: number[]
}

interface RecentProgress {
  id: string
  title: string
  type: "COURSE" | "BOOK" | "POST"
  progress: number
  status: string
  updatedAt: string
}

export default function ProgressScreen({ navigation }: any) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<"overview" | "activity" | "achievements">("overview")
  const [summary, setSummary] = useState<ProgressSummary>({
    totalListeningTime: 0,
    completedLessons: 0,
    inProgressLessons: 0,
    totalCourses: 0,
    completedCourses: 0,
    currentStreak: 0,
    longestStreak: 0,
    activeDays: [],
  })
  const [recentProgress, setRecentProgress] = useState<RecentProgress[]>([])

  useEffect(() => {
    loadProgressData()
  }, [])

  const loadProgressData = async () => {
    try {
      setLoading(true)

      // Load user progress
      const progressData = await apiService.getUserProgress()

      // Calculate summary statistics
      const completed = progressData.filter((p: any) => p.status === "COMPLETED")
      const inProgress = progressData.filter((p: any) => p.status === "IN_PROGRESS")

      // Calculate total listening time (in minutes)
      const totalTime = progressData.reduce((acc: number, p: any) => {
        return acc + (p.currentTime || 0) / 60 // Convert seconds to minutes
      }, 0)

      // Get courses data
      const coursesResponse = await apiService.getCourses({ page: 1, limit: 100 })
      const enrolledCourses = coursesResponse.courses || []

      // Calculate active days (last 30 days)
      const activeDays = calculateActiveDays(progressData)

      setSummary({
        totalListeningTime: Math.round(totalTime),
        completedLessons: completed.length,
        inProgressLessons: inProgress.length,
        totalCourses: enrolledCourses.length,
        completedCourses: 0, // TODO: Calculate from course progress
        currentStreak: calculateStreak(activeDays),
        longestStreak: calculateStreak(activeDays),
        activeDays,
      })

      // Get recent progress items
      const recent: RecentProgress[] = progressData
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10)
        .map((p: any) => ({
          id: p.id,
          title: p.post?.title || p.book?.title || p.course?.title || "Unknown",
          type: (p.postId ? "POST" : p.bookId ? "BOOK" : "COURSE") as "POST" | "BOOK" | "COURSE",
          progress: p.post?.duration ? (p.currentTime / p.post.duration) * 100 : 0,
          status: p.status,
          updatedAt: p.updatedAt,
        }))

      setRecentProgress(recent)
    } catch (error: any) {
      console.log("Error loading progress data:", error)
      
      // Handle auth errors
      if (error.message === "Unauthorized") {
        navigation.replace("AuthFlow")
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateActiveDays = (progressData: any[]) => {
    // Get unique days from progress updates in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activeDaysSet = new Set<number>()

    progressData.forEach((p: any) => {
      const date = new Date(p.updatedAt)
      if (date >= thirtyDaysAgo) {
        activeDaysSet.add(date.getDate())
      }
    })

    return Array.from(activeDaysSet)
  }

  const calculateStreak = (activeDays: number[]) => {
    // Simple calculation - count unique active days
    return activeDays.length
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Today"
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const renderOverview = () => (
    <View>
      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardLarge]}>
          <Ionicons name="time-outline" size={32} color="#007AFF" />
          <Text style={styles.statValue}>{formatTime(summary.totalListeningTime)}</Text>
          <Text style={styles.statLabel}>{t('profile.total_time')}</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="book-outline" size={28} color="#34C759" />
          <Text style={styles.statValue}>{summary.totalCourses}</Text>
          <Text style={styles.statLabel}>{t('profile.courses')}</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="flame-outline" size={28} color="#FF9500" />
          <Text style={styles.statValue}>{summary.currentStreak}</Text>
          <Text style={styles.statLabel}>{t('profile.day_streak')}</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={28} color="#5856D6" />
          <Text style={styles.statValue}>{summary.completedLessons}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="play-circle-outline" size={28} color="#FF3B30" />
          <Text style={styles.statValue}>{summary.inProgressLessons}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>

      {/* Progress Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Activity (Last 30 Days)</Text>
        <View style={styles.calendarGrid}>
          {Array.from({ length: 30 }).map((_, index) => {
            const dayNumber = new Date()
            dayNumber.setDate(dayNumber.getDate() - (29 - index))
            const isActive = summary.activeDays.includes(dayNumber.getDate())

            return (
              <View
                key={index}
                style={[
                  styles.calendarDay,
                  isActive && styles.calendarDayActive,
                ]}
              />
            )
          })}
        </View>
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: "#eee" }]} />
            <Text style={styles.legendText}>No activity</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: "#34C759" }]} />
            <Text style={styles.legendText}>Active</Text>
          </View>
        </View>
      </View>
    </View>
  )

  const renderActivity = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {recentProgress.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      ) : (
        recentProgress.map((item) => (
          <View key={item.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons
                name={
                  item.type === "POST"
                    ? "musical-notes"
                    : item.type === "BOOK"
                    ? "book"
                    : "school"
                }
                size={20}
                color="#007AFF"
              />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.activityDate}>{formatDate(item.updatedAt)}</Text>
            </View>
            <View style={styles.activityStatus}>
              {item.status === "COMPLETED" ? (
                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
              ) : (
                <View style={styles.progressCircle}>
                  <Text style={styles.progressText}>
                    {Math.round(item.progress)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  )

  const renderAchievements = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.achievementsGrid}>
        <View style={[styles.achievementCard, summary.completedLessons > 0 && styles.achievementUnlocked]}>
          <Ionicons
            name="star"
            size={32}
            color={summary.completedLessons > 0 ? "#FFD700" : "#ccc"}
          />
          <Text style={styles.achievementTitle}>First Lesson</Text>
          <Text style={styles.achievementDesc}>Complete your first lesson</Text>
        </View>

        <View style={[styles.achievementCard, summary.completedLessons >= 5 && styles.achievementUnlocked]}>
          <Ionicons
            name="trophy"
            size={32}
            color={summary.completedLessons >= 5 ? "#FFD700" : "#ccc"}
          />
          <Text style={styles.achievementTitle}>Learning Streak</Text>
          <Text style={styles.achievementDesc}>Complete 5 lessons</Text>
        </View>

        <View style={[styles.achievementCard, summary.currentStreak >= 7 && styles.achievementUnlocked]}>
          <Ionicons
            name="flame"
            size={32}
            color={summary.currentStreak >= 7 ? "#FF9500" : "#ccc"}
          />
          <Text style={styles.achievementTitle}>Week Warrior</Text>
          <Text style={styles.achievementDesc}>7 day streak</Text>
        </View>

        <View style={[styles.achievementCard, summary.completedLessons >= 10 && styles.achievementUnlocked]}>
          <Ionicons
            name="ribbon"
            size={32}
            color={summary.completedLessons >= 10 ? "#5856D6" : "#ccc"}
          />
          <Text style={styles.achievementTitle}>Dedicated Learner</Text>
          <Text style={styles.achievementDesc}>Complete 10 lessons</Text>
        </View>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Progress</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "overview" && styles.tabActive]}
          onPress={() => setSelectedTab("overview")}
        >
          <Text style={[styles.tabText, selectedTab === "overview" && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "activity" && styles.tabActive]}
          onPress={() => setSelectedTab("activity")}
        >
          <Text style={[styles.tabText, selectedTab === "activity" && styles.tabTextActive]}>
            Activity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "achievements" && styles.tabActive]}
          onPress={() => setSelectedTab("achievements")}
        >
          <Text style={[styles.tabText, selectedTab === "achievements" && styles.tabTextActive]}>
            Achievements
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === "overview" && renderOverview()}
        {selectedTab === "activity" && renderActivity()}
        {selectedTab === "achievements" && renderAchievements()}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  tabTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: (width - 56) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardLarge: {
    width: width - 40,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 15,
  },
  calendarDay: {
    width: (width - 76) / 10,
    height: (width - 76) / 10,
    backgroundColor: "#eee",
    borderRadius: 4,
  },
  calendarDayActive: {
    backgroundColor: "#34C759",
  },
  calendarLegend: {
    flexDirection: "row",
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 15,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 13,
    color: "#666",
  },
  activityStatus: {
    marginLeft: 10,
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  achievementCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: (width - 56) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    opacity: 0.5,
  },
  achievementUnlocked: {
    opacity: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginTop: 10,
    textAlign: "center",
  },
  achievementDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
})
