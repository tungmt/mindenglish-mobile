"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, FlatList } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAudio } from "../context/AudioContext"

interface AudioBook {
  id: string
  title: string
  author: string
  description: string
  thumbnail: string
  totalDuration: number
  chaptersCount: number
  level: string
  category: string
  isDownloaded: boolean
  chapters: Chapter[]
}

interface Chapter {
  id: string
  title: string
  duration: number
  lessons: Lesson[]
  isCompleted: boolean
}

interface Lesson {
  id: string
  title: string
  duration: number
  audioUrl: string
  isCompleted: boolean
  isDownloaded: boolean
  order: number
}

export default function AudioBookDetailScreen({ navigation, route }: any) {
  const { bookId } = route.params
  const { playTrack } = useAudio()
  const [audioBook, setAudioBook] = useState<AudioBook | null>(null)
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAudioBookDetail()
  }, [bookId])

  const loadAudioBookDetail = async () => {
    try {
      setLoading(true)
      // Import and fetch audiobook from API
      const { apiService } = await import("../services/api")
      const audiobookData = await apiService.getAudiobookById(bookId)

      console.log({data: JSON.stringify(audiobookData)})
      
      // Transform API data to match component interface
      const chapters = (audiobookData.chapters || []).map((chapter: any) => {
        const chapterLessons = chapter.lessons || []
        const chapterDuration = chapterLessons.reduce((sum: number, l: any) => sum + (l.duration || 0), 0)
        
        return {
          id: chapter.id,
          title: chapter.title,
          duration: chapterDuration * 1000, // Convert to milliseconds
          isCompleted: false, // TODO: Calculate from user progress
          lessons: chapterLessons.map((lesson: any) => ({
            id: lesson.id,
            title: lesson.title,
            duration: (lesson.duration || 0) * 1000, // Convert seconds to milliseconds
            audioUrl: lesson.audioUrl || "",
            isCompleted: false, // TODO: Get from user progress
            isDownloaded: false, // TODO: Track downloads locally
            order: lesson.order,
          })),
        }
      })
      
      const totalDuration = chapters.reduce((sum, c) => sum + c.duration, 0)
      
      setAudioBook({
        id: audiobookData.id,
        title: audiobookData.title,
        author: "Cô Thúy", // TODO: Add author field to audiobook model
        description: audiobookData.description || "Chưa có mô tả",
        thumbnail: audiobookData.coverImage || audiobookData.avatar || "/placeholder.svg",
        totalDuration: totalDuration,
        chaptersCount: chapters.length,
        level: audiobookData.level || "BEGINNER",
        category: "Audiobook",
        isDownloaded: false, // TODO: Track downloads locally
        chapters: chapters,
      })
    } catch (error) {
      console.error("Error loading audio book detail:", error)
      // Show error to user or navigate back
      setAudioBook(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayLesson = async (lesson: Lesson, chapterTitle: string) => {
    const audioTrack = {
      id: lesson.id,
      title: `${chapterTitle} - ${lesson.title}`,
      url: lesson.audioUrl,
      duration: lesson.duration,
      courseId: audioBook!.id,
      isCompleted: lesson.isCompleted,
      isDownloaded: lesson.isDownloaded,
    }

    await playTrack(audioTrack)
    navigation.navigate("AudioPlayer", { trackId: lesson.id })
  }

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const toggleChapter = (chapterId: string) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId)
  }

  const renderLesson = (lesson: Lesson, chapterTitle: string) => (
    <TouchableOpacity key={lesson.id} style={styles.lessonItem} onPress={() => handlePlayLesson(lesson, chapterTitle)}>
      <View style={styles.lessonLeft}>
        <View style={[styles.lessonNumber, lesson.isCompleted && styles.lessonCompleted]}>
          {lesson.isCompleted ? (
            <Ionicons name="checkmark" size={12} color="white" />
          ) : (
            <Text style={styles.lessonNumberText}>{lesson.order}</Text>
          )}
        </View>
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <View style={styles.lessonMeta}>
            <Text style={styles.lessonDuration}>{formatDuration(lesson.duration)}</Text>
            {lesson.isDownloaded && (
              <View style={styles.downloadedIndicator}>
                <Ionicons name="download" size={12} color="#34C759" />
              </View>
            )}
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.lessonPlayButton}>
        <Ionicons name="play" size={16} color="#007AFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  const renderChapter = ({ item: chapter }: { item: Chapter }) => (
    <View style={styles.chapterContainer}>
      <TouchableOpacity style={styles.chapterHeader} onPress={() => toggleChapter(chapter.id)}>
        <View style={styles.chapterLeft}>
          <View style={[styles.chapterIcon, chapter.isCompleted && styles.chapterCompleted]}>
            {chapter.isCompleted ? (
              <Ionicons name="checkmark" size={16} color="white" />
            ) : (
              <Ionicons name="book-outline" size={16} color="#666" />
            )}
          </View>
          <View style={styles.chapterInfo}>
            <Text style={styles.chapterTitle}>{chapter.title}</Text>
            <Text style={styles.chapterDuration}>
              {chapter.lessons.length} bài • {formatDuration(chapter.duration)}
            </Text>
          </View>
        </View>
        <Ionicons name={expandedChapter === chapter.id ? "chevron-up" : "chevron-down"} size={20} color="#666" />
      </TouchableOpacity>

      {expandedChapter === chapter.id && (
        <View style={styles.lessonsContainer}>
          {chapter.lessons.map((lesson) => renderLesson(lesson, chapter.title))}
        </View>
      )}
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    )
  }

  if (!audioBook) {
    return (
      <View style={styles.errorContainer}>
        <Text>Không tìm thấy audio book</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audio Book</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Book Info */}
        <View style={styles.bookInfo}>
          <Image source={{ uri: audioBook.thumbnail }} style={styles.bookCover} />
          <View style={styles.bookDetails}>
            <Text style={styles.bookTitle}>{audioBook.title}</Text>
            <Text style={styles.bookAuthor}>bởi {audioBook.author}</Text>

            <View style={styles.bookStats}>
              <View style={styles.statItem}>
                <Ionicons name="book-outline" size={16} color="#666" />
                <Text style={styles.statText}>{audioBook.chaptersCount} chương</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.statText}>{formatDuration(audioBook.totalDuration)}</Text>
              </View>
            </View>

            <View style={styles.bookLevel}>
              <Text style={styles.bookLevelText}>{audioBook.level}</Text>
            </View>

            <Text style={styles.bookDescription}>{audioBook.description}</Text>

            <TouchableOpacity style={styles.downloadButton}>
              <Ionicons name="download-outline" size={20} color="#007AFF" />
              <Text style={styles.downloadButtonText}>Tải xuống toàn bộ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chapters List */}
        <View style={styles.chaptersSection}>
          <Text style={styles.sectionTitle}>Danh sách chương</Text>
          <FlatList
            data={audioBook.chapters}
            renderItem={renderChapter}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  bookInfo: {
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
  bookCover: {
    width: 120,
    height: 160,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 20,
  },
  bookDetails: {
    alignItems: "center",
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  bookAuthor: {
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 15,
  },
  bookStats: {
    flexDirection: "row",
    marginBottom: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
  },
  statText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  bookLevel: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 15,
  },
  bookLevelText: {
    fontSize: 12,
    color: "#1976d2",
    fontWeight: "600",
  },
  bookDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  chaptersSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  chapterContainer: {
    marginBottom: 10,
  },
  chapterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  chapterLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  chapterIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chapterCompleted: {
    backgroundColor: "#34C759",
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  chapterDuration: {
    fontSize: 12,
    color: "#666",
  },
  lessonsContainer: {
    paddingLeft: 20,
    paddingTop: 10,
  },
  lessonItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  lessonLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  lessonNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  lessonCompleted: {
    backgroundColor: "#34C759",
  },
  lessonNumberText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  lessonMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  lessonDuration: {
    fontSize: 12,
    color: "#666",
    marginRight: 8,
  },
  downloadedIndicator: {
    marginLeft: 4,
  },
  lessonPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
  },
})
