"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
  Modal,
  Animated,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Slider from "@react-native-community/slider"
import { useTranslation } from "react-i18next"
import { useAudio } from "../context/AudioContext"

const { width, height } = Dimensions.get("window")
const PLAYER_MAX_HEIGHT = 520
const PLAYER_MIN_HEIGHT = 80

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  timestamp: number
  likes: number
  isLiked: boolean
  replies?: Comment[]
}

export default function AudioPlayerScreen({ navigation, route }: any) {
  const { t } = useTranslation()
  const { trackId } = route.params || {}
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    playbackRate,
    isLoading,
    comments,
    pauseTrack,
    resumeTrack,
    seekTo,
    setPlaybackRate,
    markAsCompleted,
    markAsRepeat,
    toggleFavorite,
    downloadTrack,
    addComment,
    likeComment,
  } = useAudio()

  const [activeTab, setActiveTab] = useState<"transcript" | "notes" | "comments">("transcript")
  const [showSpeedModal, setShowSpeedModal] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false)

  const scrollY = useRef(new Animated.Value(0)).current
  const playerHeight = useRef(new Animated.Value(PLAYER_MAX_HEIGHT)).current

  const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]

  useEffect(() => {
    if (!currentTrack && trackId) {
      // Load track if not already loaded
      navigation.goBack()
    }
  }, [currentTrack, trackId])

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y
        if (offsetY > 50 && !isPlayerMinimized) {
          minimizePlayer()
        } else if (offsetY <= 10 && isPlayerMinimized) {
          expandPlayer()
        }
      },
    }
  )

  const minimizePlayer = () => {
    setIsPlayerMinimized(true)
    Animated.timing(playerHeight, {
      toValue: PLAYER_MIN_HEIGHT,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }

  const expandPlayer = () => {
    setIsPlayerMinimized(false)
    Animated.timing(playerHeight, {
      toValue: PLAYER_MAX_HEIGHT,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }

  const togglePlayerSize = () => {
    if (isPlayerMinimized) {
      expandPlayer()
    } else {
      minimizePlayer()
    }
  }

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    const weeks = Math.floor(diff / 604800000)

    if (minutes < 1) return t('audioPlayer.just_now')
    if (minutes < 60) return t('audioPlayer.minutes_ago', { count: minutes })
    if (hours < 24) return t('audioPlayer.hours_ago', { count: hours })
    if (days < 7) return t('audioPlayer.days_ago', { count: days })
    return t('audioPlayer.weeks_ago', { count: weeks })
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack()
    } else {
      resumeTrack()
    }
  }

  const handleSeek = (value: number) => {
    seekTo(value)
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed)
    setShowSpeedModal(false)
  }

  const handleMarkCompleted = () => {
    if (currentTrack) {
      markAsCompleted(currentTrack.id)
      Alert.alert(t('common.success'), t('audioPlayer.marked_completed'))
    }
  }

  const handleMarkRepeat = () => {
    if (currentTrack) {
      markAsRepeat(currentTrack.id)
      const message = currentTrack.isMarkedForRepeat ? t('audioPlayer.unmarked_repeat') : t('audioPlayer.marked_repeat')
      Alert.alert(t('common.success'), message)
    }
  }

  const handleToggleFavorite = () => {
    if (currentTrack) {
      toggleFavorite(currentTrack.id)
    }
  }

  const handleDownload = () => {
    if (currentTrack) {
      downloadTrack(currentTrack.id)
    }
  }

  const handleAddComment = async () => {
    if (commentText.trim() && currentTrack) {
      await addComment(currentTrack.id, commentText.trim())
      setCommentText("")
      setShowCommentInput(false)
    }
  }

  const renderComment = (comment: Comment) => (
    <View key={comment.id} style={styles.commentItem}>
      <Image source={{ uri: comment.userAvatar }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUserName}>{comment.userName}</Text>
          <Text style={styles.commentTime}>{getTimeAgo(comment.timestamp)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentAction} onPress={() => likeComment(comment.id)}>
            <Ionicons
              name={comment.isLiked ? "heart" : "heart-outline"}
              size={16}
              color={comment.isLiked ? "#FF3B30" : "#666"}
            />
            <Text style={styles.commentActionText}>{comment.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.commentAction}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.commentActionText}>{t('audioPlayer.reply')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  if (!currentTrack) {
    return (
      <View style={styles.container}>
        <Text>{t('audioPlayer.not_found')}</Text>
      </View>
    )
  }

  const imageOpacity = playerHeight.interpolate({
    inputRange: [PLAYER_MIN_HEIGHT, PLAYER_MAX_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  const controlsOpacity = playerHeight.interpolate({
    inputRange: [PLAYER_MIN_HEIGHT, PLAYER_MAX_HEIGHT * 0.4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  const miniPlayerOpacity = playerHeight.interpolate({
    inputRange: [PLAYER_MIN_HEIGHT, PLAYER_MAX_HEIGHT * 0.3],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <TouchableOpacity onPress={() => { }}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Collapsible Player Section */}
      <Animated.View style={[styles.playerSection, { height: playerHeight }]}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={togglePlayerSize}
          style={styles.playerTouchable}
        >
          {/* Minimized Player */}
          <Animated.View style={[styles.miniPlayer, { opacity: miniPlayerOpacity }]}>
            <Image
              source={{ uri: `/placeholder.svg?height=60&width=60&text=${encodeURIComponent(currentTrack.title)}` }}
              style={styles.miniPlayerImage}
            />
            <View style={styles.miniPlayerInfo}>
              <Text style={styles.miniPlayerTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.miniPlayerSubtitle}>MindEnglish</Text>
            </View>
            <TouchableOpacity 
              style={styles.miniPlayerButton} 
              onPress={(e) => {
                e.stopPropagation()
                handlePlayPause()
              }}
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#007AFF" />
            </TouchableOpacity>
          </Animated.View>

          {/* Full Player */}
          <Animated.View style={[styles.fullPlayer, { opacity: imageOpacity }]}>
            {/* Audio Info */}
            <View style={styles.audioInfo}>
              <Image
                source={{ uri: `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(currentTrack.title)}` }}
                style={styles.audioImage}
              />
              <Text style={styles.audioTitle}>{currentTrack.title}</Text>
              <Text style={styles.audioSubtitle}>MindEnglish</Text>
            </View>

            {/* Progress Bar */}
            <Animated.View style={[styles.progressContainer, { opacity: controlsOpacity }]}>
              <Slider
                style={styles.progressSlider}
                minimumValue={0}
                maximumValue={duration}
                value={position}
                onValueChange={handleSeek}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor="#007AFF"
              />
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </Animated.View>

            {/* Controls */}
            <Animated.View style={[styles.controls, { opacity: controlsOpacity }]}>
              <TouchableOpacity style={styles.controlButton} onPress={() => seekTo(Math.max(0, position - 15000))}>
                <Ionicons name="play-back" size={24} color="#333" />
                <Text style={styles.controlLabel}>-15s</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.playButton} onPress={handlePlayPause} disabled={isLoading}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="white" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton} onPress={() => seekTo(Math.min(duration, position + 15000))}>
                <Ionicons name="play-forward" size={24} color="#333" />
                <Text style={styles.controlLabel}>+15s</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Speed and Actions */}
            <Animated.View style={[styles.actionsRow, { opacity: controlsOpacity }]}>
              <TouchableOpacity style={styles.actionButton} onPress={() => setShowSpeedModal(true)}>
                <Text style={styles.speedText}>{playbackRate}x</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleToggleFavorite}>
                <Ionicons
                  name={currentTrack.isFavorite ? "heart" : "heart-outline"}
                  size={24}
                  color={currentTrack.isFavorite ? "#FF3B30" : "#666"}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
                {currentTrack.downloadProgress !== undefined ? (
                  <View style={styles.downloadProgress}>
                    <Text style={styles.downloadText}>{currentTrack.downloadProgress}%</Text>
                  </View>
                ) : (
                  <Ionicons
                    name={currentTrack.isDownloaded ? "download" : "download-outline"}
                    size={24}
                    color={currentTrack.isDownloaded ? "#34C759" : "#666"}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleMarkRepeat}>
                <Ionicons
                  name={currentTrack.isMarkedForRepeat ? "repeat" : "repeat-outline"}
                  size={24}
                  color={currentTrack.isMarkedForRepeat ? "#007AFF" : "#666"}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleMarkCompleted}>
                <Ionicons
                  name={currentTrack.isCompleted ? "checkmark-circle" : "checkmark-circle-outline"}
                  size={24}
                  color={currentTrack.isCompleted ? "#34C759" : "#666"}
                />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "transcript" && styles.activeTab]}
          onPress={() => setActiveTab("transcript")}
        >
          <Text style={[styles.tabText, activeTab === "transcript" && styles.activeTabText]}>{t('audioPlayer.transcript')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "notes" && styles.activeTab]}
          onPress={() => setActiveTab("notes")}
        >
          <Text style={[styles.tabText, activeTab === "notes" && styles.activeTabText]}>{t('audioPlayer.notes')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "comments" && styles.activeTab]}
          onPress={() => setActiveTab("comments")}
        >
          <Text style={[styles.tabText, activeTab === "comments" && styles.activeTabText]}>
            {t('audioPlayer.comments', { count: comments.length })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.contentScrollView}
        contentContainerStyle={styles.contentScrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      >
        {activeTab === "transcript" && (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptText}>
              {currentTrack.transcript ||
                t('audioPlayer.transcript_placeholder')}
            </Text>
          </View>
        )}

        {activeTab === "notes" && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>
              {currentTrack.notes ||
                t('audioPlayer.notes_placeholder')}
            </Text>
          </View>
        )}

        {activeTab === "comments" && (
          <View style={styles.commentsContainer}>
            {comments.length > 0 ? (
              comments.map(renderComment)
            ) : (
              <View style={styles.noComments}>
                <Text style={styles.noCommentsText}>{t('audioPlayer.no_comments')}</Text>
                <Text style={styles.noCommentsSubtext}>{t('audioPlayer.be_first')}</Text>
              </View>
            )}
          </View>
        )}
      </Animated.ScrollView>

      {/* Comment Input */}
      {activeTab === "comments" && (
        <View style={styles.commentInputContainer}>
          {showCommentInput ? (
            <View style={styles.commentInputExpanded}>
              <TextInput
                style={styles.commentInput}
                placeholder={t('audioPlayer.write_comment')}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <View style={styles.commentInputActions}>
                <TouchableOpacity onPress={() => setShowCommentInput(false)}>
                  <Text style={styles.commentCancel}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddComment} disabled={!commentText.trim()}>
                  <Text style={[styles.commentPost, !commentText.trim() && styles.commentPostDisabled]}>
                    {t('audioPlayer.post')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.commentInputButton} onPress={() => setShowCommentInput(true)}>
              <Text style={styles.commentInputPlaceholder}>{t('audioPlayer.add_comment')}</Text>
              <Ionicons name="chatbubble-outline" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Speed Modal */}
      <Modal visible={showSpeedModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.speedModal}>
            <Text style={styles.speedModalTitle}>{t('audioPlayer.playback_speed')}</Text>
            {playbackSpeeds.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[styles.speedOption, playbackRate === speed && styles.speedOptionActive]}
                onPress={() => handleSpeedChange(speed)}
              >
                <Text style={[styles.speedOptionText, playbackRate === speed && styles.speedOptionTextActive]}>
                  {speed}x
                </Text>
                {playbackRate === speed && <Ionicons name="checkmark" size={20} color="#007AFF" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.speedModalClose} onPress={() => setShowSpeedModal(false)}>
              <Text style={styles.speedModalCloseText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "#f8f9fa",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 20,
  },
  playerSection: {
    backgroundColor: "#f8f9fa",
    overflow: "hidden",
  },
  playerTouchable: {
    flex: 1,
  },
  miniPlayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: PLAYER_MIN_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  miniPlayerImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  miniPlayerInfo: {
    flex: 1,
  },
  miniPlayerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  miniPlayerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  miniPlayerButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  fullPlayer: {
    flex: 1,
  },
  audioInfo: {
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 20,
    marginBottom: 20,
  },
  audioImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginBottom: 20,
  },
  audioTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  audioSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  progressContainer: {
    paddingHorizontal: 40,
    marginBottom: 15,
  },
  progressSlider: {
    width: "100%",
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 14,
    color: "#666",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  controlButton: {
    alignItems: "center",
    marginHorizontal: 30,
  },
  controlLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
    marginBottom: 10,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
  speedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  downloadProgress: {
    alignItems: "center",
    justifyContent: "center",
  },
  downloadText: {
    fontSize: 10,
    color: "#007AFF",
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
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
  contentScrollView: {
    flex: 1,
  },
  contentScrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  transcriptContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    minHeight: 300,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  notesContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    minHeight: 300,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  commentsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    minHeight: 300,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: "row",
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  commentActionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  noComments: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: "#999",
  },
  commentInputContainer: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  commentInputButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  commentInputPlaceholder: {
    fontSize: 14,
    color: "#666",
  },
  commentInputExpanded: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
  },
  commentInput: {
    fontSize: 14,
    color: "#333",
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  commentInputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  commentCancel: {
    fontSize: 14,
    color: "#666",
    marginRight: 15,
  },
  commentPost: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  commentPostDisabled: {
    color: "#ccc",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  speedModal: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  speedModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  speedOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  speedOptionActive: {
    backgroundColor: "#f0f8ff",
  },
  speedOptionText: {
    fontSize: 16,
    color: "#333",
  },
  speedOptionTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  speedModalClose: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  speedModalCloseText: {
    fontSize: 16,
    color: "#007AFF",
    textAlign: "center",
  },
})
