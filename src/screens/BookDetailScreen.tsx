"use client"

import { useState, useEffect } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, FlatList } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAudio } from "../context/AudioContext"
import { useTranslation } from "react-i18next"

interface Book {
  id: string
  title: string
  author: string
  description: string
  thumbnail: string
  totalDuration: number
  postsCount: number
  level: string
  bookType: "AUDIO" | "ARTICLE"
  accessMode: "SEQUENCE" | "PARALLEL"
  isDownloaded: boolean
  posts: Post[]
}

interface Post {
  id: string
  title: string
  duration: number
  postType: "AUDIO" | "ARTICLE"
  audioUrl?: string
  content?: string
  isCompleted: boolean
  isDownloaded: boolean
  isLocked: boolean
  order: number
}

export default function BookDetailScreen({ navigation, route }: any) {
  const { bookId } = route.params
  const { playTrack } = useAudio()
  const { t } = useTranslation()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookDetail()
  }, [bookId])

  const loadBookDetail = async () => {
    try {
      setLoading(true)
      // Import and fetch book from API
      const { apiService } = await import("../services/api")
      const bookData = await apiService.getBookById(bookId)

      console.log('BookDetailScreen - Loaded book:', bookData.id, bookData.title)

      // Transform API data to match component interface
      const bookPosts: any[] = bookData.bookPosts || []
      const posts = bookPosts.map((bp, index) => {
        const post = bp.post
        // Get progress from userProgress if available
        const isCompleted = post.userProgress?.status === 'COMPLETED'
        
        // Lock logic for sequential books
        let isLocked = false
        if (bookData.accessMode === 'SEQUENCE' && index > 0) {
          // In sequential mode, lock if previous post not completed
          const prevBp = bookPosts[index - 1]
          const prevCompleted = prevBp?.post?.userProgress?.status === 'COMPLETED'
          isLocked = !prevCompleted
        }
        
        return {
          id: post.id,
          title: post.title,
          duration: (post.duration || 0) * 1000, // Convert seconds to milliseconds
          postType: post.postType,
          audioUrl: post.audioUrl || "",
          content: post.content || "",
          isCompleted: isCompleted,
          isDownloaded: false, // TODO: Track downloads locally
          isLocked: isLocked,
          order: bp.order,
        }
      })

      const totalDuration = posts.reduce((sum: number, p: any) => sum + p.duration, 0)

      setBook({
        id: bookData.id,
        title: bookData.title,
        author: bookData.author || t('common.unknown_author'),
        description: bookData.description || t('bookDetail.no_description'),
        thumbnail: bookData.coverImage || "/placeholder.svg",
        totalDuration: totalDuration,
        postsCount: posts.length,
        level: bookData.level || "BEGINNER",
        bookType: bookData.bookType,
        accessMode: bookData.accessMode || "SEQUENCE",
        isDownloaded: false, // TODO: Track downloads locally
        posts: posts,
      })
    } catch (error: any) {
      console.error("Error loading book detail:", error)
      const { Alert } = await import('react-native')
      Alert.alert(
        t('common.error'), 
        error?.message || t('bookDetail.error_loading'),
        [
          { text: t('common.ok'), onPress: () => navigation.goBack() }
        ]
      )
      setBook(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayPost = async (post: Post) => {
    if (post.isLocked) {
      alert(t('bookDetail.post_locked'))
      return
    }

    if (post.postType === "AUDIO" && post.audioUrl) {
      const audioTrack = {
        id: post.id,
        title: `${book!.title} - ${post.title}`,
        url: post.audioUrl,
        duration: post.duration,
        courseId: book!.id,
        isCompleted: post.isCompleted,
        isDownloaded: post.isDownloaded,
      }

      await playTrack(audioTrack)
      navigation.navigate("AudioPlayer", { trackId: post.id })
    } else if (post.postType === "ARTICLE") {
      // Navigate to article reading screen
      // navigation.navigate("ArticleReader", { postId: post.id })
      alert(t('bookDetail.article_reading_coming_soon'))
    }
  }

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const renderPost = (post: Post) => (
    <TouchableOpacity
      key={post.id}
      style={[styles.postItem, post.isLocked && styles.postLocked]}
      onPress={() => handlePlayPost(post)}
      disabled={post.isLocked}
    >
      <View style={styles.postLeft}>
        <View style={[styles.postNumber, post.isCompleted && styles.postCompleted]}>
          {post.isCompleted ? (
            <Ionicons name="checkmark" size={12} color="white" />
          ) : (
            <Text style={styles.postNumberText}>{post.order}</Text>
          )}
        </View>
        <View style={styles.postInfo}>
          <View style={styles.postTitleRow}>
            <Text style={styles.postTitle}>{post.title}</Text>
            {post.postType === "AUDIO" ? (
              <Ionicons name="musical-notes" size={14} color="#007AFF" style={styles.postTypeIcon} />
            ) : (
              <Ionicons name="document-text" size={14} color="#34C759" style={styles.postTypeIcon} />
            )}
          </View>
          <View style={styles.postMeta}>
            {post.postType === "AUDIO" && (
              <Text style={styles.postDuration}>{formatDuration(post.duration)}</Text>
            )}
            {post.isDownloaded && (
              <View style={styles.downloadedIndicator}>
                <Ionicons name="download" size={12} color="#34C759" />
              </View>
            )}
            {post.isLocked && (
              <View style={styles.lockedIndicator}>
                <Ionicons name="lock-closed" size={12} color="#999" />
              </View>
            )}
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.postPlayButton}>
        <Ionicons name={post.postType === "AUDIO" ? "play" : "eye"} size={16} color="#007AFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('common.loading')}</Text>
      </View>
    )
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Text>{t('bookDetail.not_found')}</Text>
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
        <Text style={styles.headerTitle}>{t('bookDetail.title')}</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Book Info */}
        <View style={styles.bookInfo}>
          <Image source={{ uri: book.thumbnail }} style={styles.bookCover} />
          <View style={styles.bookDetails}>
            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.bookAuthor}>{t('common.by', { name: book.author })}</Text>

            <View style={styles.bookStats}>
              <View style={styles.statItem}>
                <Ionicons
                  name={book.bookType === "AUDIO" ? "musical-notes" : "document-text"}
                  size={16}
                  color="#666"
                />
                <Text style={styles.statText}>
                  {book.bookType === "AUDIO" ? t('bookDetail.audio_book') : t('bookDetail.article_book')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="list-outline" size={16} color="#666" />
                <Text style={styles.statText}>{t('bookDetail.posts_count', { count: book.postsCount })}</Text>
              </View>
              {book.bookType === "AUDIO" && (
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.statText}>{formatDuration(book.totalDuration)}</Text>
                </View>
              )}
            </View>

            <View style={styles.bookMeta}>
              <View style={styles.bookLevel}>
                <Text style={styles.bookLevelText}>{book.level}</Text>
              </View>
              <View style={styles.bookAccessMode}>
                <Ionicons
                  name={book.accessMode === "SEQUENCE" ? "arrow-forward" : "apps"}
                  size={12}
                  color="#1976d2"
                />
                <Text style={styles.bookAccessModeText}>
                  {book.accessMode === "SEQUENCE" ? t('bookDetail.sequential') : t('bookDetail.parallel')}
                </Text>
              </View>
            </View>

            <Text style={styles.bookDescription}>{book.description}</Text>

            {book.bookType === "AUDIO" && (
              <TouchableOpacity style={styles.downloadButton}>
                <Ionicons name="download-outline" size={20} color="#007AFF" />
                <Text style={styles.downloadButtonText}>{t('bookDetail.download_all')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Posts List */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>{t('bookDetail.content_list')}</Text>
          {book.posts.map(renderPost)}
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
    flexWrap: "wrap",
    justifyContent: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginVertical: 4,
  },
  statText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  bookMeta: {
    flexDirection: "row",
    marginBottom: 15,
  },
  bookLevel: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  bookLevelText: {
    fontSize: 12,
    color: "#1976d2",
    fontWeight: "600",
  },
  bookAccessMode: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f8ff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookAccessModeText: {
    fontSize: 12,
    color: "#1976d2",
    fontWeight: "600",
    marginLeft: 4,
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
  postsSection: {
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
  postItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  postLocked: {
    opacity: 0.5,
  },
  postLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  postNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  postCompleted: {
    backgroundColor: "#34C759",
  },
  postNumberText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  postInfo: {
    flex: 1,
  },
  postTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  postTypeIcon: {
    marginLeft: 4,
  },
  postMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  postDuration: {
    fontSize: 12,
    color: "#666",
    marginRight: 8,
  },
  downloadedIndicator: {
    marginRight: 4,
  },
  lockedIndicator: {
    marginRight: 4,
  },
  postPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
  },
})
