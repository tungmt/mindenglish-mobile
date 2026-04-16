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
  Alert
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { apiService } from "../services/api"

const { width } = Dimensions.get("window")

interface ArticleReaderScreenProps {
  navigation: any
  route: {
    params: {
      postId: string
      bookId?: string
    }
  }
}

interface Post {
  id: string
  title: string
  description?: string
  content: string
  postType: "AUDIO" | "ARTICLE"
  readTime?: number
}

export default function ArticleReaderScreen({ navigation, route }: ArticleReaderScreenProps) {
  const { t } = useTranslation()
  const { postId, bookId } = route.params
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [fontSize, setFontSize] = useState(16)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    loadArticle()
  }, [postId])

  const loadArticle = async () => {
    try {
      setLoading(true)
      // Import and fetch post from API
      const { apiService } = await import("../services/api")
      const postData = await apiService.getPostById(postId)

      console.log('ArticleReaderScreen - Loaded post:', postData.id, postData.title)

      setPost({
        id: postData.id,
        title: postData.title,
        description: postData.description,
        content: postData.content || t('articleReader.no_content'),
        postType: postData.postType,
      })
    } catch (error: any) {
      console.log("Error loading article:", error)
      const { Alert } = await import('react-native')
      Alert.alert(
        t('common.error'), 
        error?.message || t('articleReader.error_loading'),
        [
          { text: t('common.ok'), onPress: () => navigation.goBack() }
        ]
      )
      setPost(null)
    } finally {
      setLoading(false)
    }
  }

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    const scrollProgress = contentOffset.y / (contentSize.height - layoutMeasurement.height)
    setProgress(Math.min(scrollProgress * 100, 100))
  }

  const increaseFontSize = () => {
    if (fontSize < 24) {
      setFontSize(fontSize + 2)
    }
  }

  const decreaseFontSize = () => {
    if (fontSize > 12) {
      setFontSize(fontSize - 2)
    }
  }

  const markAsCompleted = async () => {
    try {
      await apiService.updateProgress({
        postId: postId,
        status: 'COMPLETED',
      })
      
      Alert.alert(t('common.success'), t('articleReader.marked_completed'))
    } catch (error) {
      console.log("Error marking as completed:", error)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    )
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-text-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>{t('articleReader.not_found')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{post.title}</Text>
          {post.readTime && (
            <Text style={styles.readTime}>
              {t('articleReader.read_time', { minutes: post.readTime })}
            </Text>
          )}
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={decreaseFontSize} style={styles.headerButton}>
            <Ionicons name="remove-circle-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={increaseFontSize} style={styles.headerButton}>
            <Ionicons name="add-circle-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={[styles.title, { fontSize: fontSize + 8 }]}>{post.title}</Text>
        
        {post.description && (
          <Text style={[styles.description, { fontSize: fontSize }]}>
            {post.description}
          </Text>
        )}

        <Text style={[styles.articleContent, { fontSize }]}>
          {post.content}
        </Text>

        {/* Mark as Completed Button */}
        <TouchableOpacity 
          style={styles.completedButton}
          onPress={markAsCompleted}
        >
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.completedButtonText}>
            {t('articleReader.mark_completed')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerButton: {
    padding: 5,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  readTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: "#f0f0f0",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#34C759",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontWeight: "bold",
    color: "#333",
    marginTop: 30,
    marginBottom: 15,
    lineHeight: 32,
  },
  description: {
    color: "#666",
    marginBottom: 20,
    lineHeight: 24,
    fontStyle: "italic",
  },
  articleContent: {
    color: "#333",
    lineHeight: 28,
    marginBottom: 30,
  },
  completedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34C759",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 40,
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  completedButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
})
