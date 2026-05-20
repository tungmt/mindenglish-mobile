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
import images from "../constants/images"

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
    playlist,
    currentIndex,
    pauseTrack,
    resumeTrack,
    playNext,
    playPrevious,
    playPlaylist,
    seekTo,
    setPlaybackRate,
    markAsCompleted,
    markAsRepeat,
    toggleFavorite,
    downloadTrack,
    addComment,
    likeComment,
  } = useAudio()

  const [activeTab, setActiveTab] = useState<"notes" | "comments" | "playlist">("playlist")
  const [showSpeedModal, setShowSpeedModal] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false)
  const [showScrollTopButton, setShowScrollTopButton] = useState(false)

  const scrollY = useRef(new Animated.Value(0)).current
  const mainScrollRef = useRef<ScrollView | null>(null)

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

        if (offsetY > 280 && !showScrollTopButton) {
          setShowScrollTopButton(true)
        } else if (offsetY <= 280 && showScrollTopButton) {
          setShowScrollTopButton(false)
        }
      },
    }
  )

  const handleScrollToTop = () => {
    mainScrollRef.current?.scrollTo({ y: 0, animated: true })
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

  const handlePlayTrackFromPlaylist = async (index: number) => {
    if (index !== currentIndex && playlist.length > 0) {
      console.log(`🎵 User selected track ${index + 1} from playlist`)
      await playPlaylist(playlist, index)
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <TouchableOpacity onPress={() => { }}>
          {/* <Ionicons name="ellipsis-horizontal" size={24} color="#333" /> */}
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        ref={mainScrollRef}
        contentContainerStyle={styles.screenScrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      >

      {/* Collapsible Player Section */}
      <Animated.View style={[styles.playerSection]}>
        <View
          style={styles.playerTouchable}
        >
          <Animated.View style={[styles.fullPlayer, { opacity: 1 }]}>
            {/* Audio Info */}
            <View style={styles.audioInfo}>
              <Image
                source={images.appIcon}
                style={styles.audioImage}
              />
              <Text style={styles.audioTitle}>{currentTrack.title}</Text>
              <Text style={styles.audioSubtitle}>MindEnglish</Text>
              {playlist.length > 0 && (
                <Text style={styles.playlistPosition}>
                  {currentIndex + 1} / {playlist.length}
                </Text>
              )}
            </View>

            {/* Progress Bar */}
            <Animated.View style={[styles.progressContainer, { opacity: 1 }]}>
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
            <Animated.View style={[styles.controls, { opacity: 1 }]}>
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={playPrevious}
                disabled={currentIndex <= 0 || playlist.length === 0}
              >
                <Ionicons 
                  name="play-skip-back" 
                  size={32} 
                  color={currentIndex <= 0 || playlist.length === 0 ? "#CCC" : "#333"} 
                />
              </TouchableOpacity>

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

              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={playNext}
                disabled={currentIndex >= playlist.length - 1 || playlist.length === 0}
              >
                <Ionicons 
                  name="play-skip-forward" 
                  size={32} 
                  color={currentIndex >= playlist.length - 1 || playlist.length === 0 ? "#CCC" : "#333"} 
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Speed and Actions */}
            <Animated.View style={[styles.actionsRow, { opacity: 1 }]}>
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
        </View>
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {/* <TouchableOpacity
          style={[styles.tab, activeTab === "transcript" && styles.activeTab]}
          onPress={() => setActiveTab("transcript")}
        >
          <Text style={[styles.tabText, activeTab === "transcript" && styles.activeTabText]}>{t('audioPlayer.transcript')}</Text>
        </TouchableOpacity> */}
        {playlist.length > 0 && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "playlist" && styles.activeTab]}
            onPress={() => setActiveTab("playlist")}
          >
            <Text style={[styles.tabText, activeTab === "playlist" && styles.activeTabText]}>
              Playlist ({playlist.length})
            </Text>
          </TouchableOpacity>
        )}
        {/* <TouchableOpacity
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
        </TouchableOpacity> */}
      </View>

      {/* Scrollable Content */}
      <View style={styles.contentContainer}>
        {/* {activeTab === "transcript" && (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptText}>
              {currentTrack.transcript ||
                t('audioPlayer.transcript_placeholder')}
            </Text>
          </View>
        )} */}

        {activeTab === "playlist" && (
          <View style={styles.playlistContainer}>
            {playlist.length > 0 ? (
              playlist.map((track, index) => (
                <TouchableOpacity
                  key={track.id}
                  style={[
                    styles.playlistItem,
                    currentIndex === index && styles.playlistItemActive
                  ]}
                  onPress={() => handlePlayTrackFromPlaylist(index)}
                >
                  <View style={styles.playlistItemLeft}>
                    <View style={[
                      styles.playlistNumber,
                      currentIndex === index && styles.playlistNumberActive
                    ]}>
                      {currentIndex === index && isPlaying ? (
                        <Ionicons name="volume-high" size={16} color="#007AFF" />
                      ) : (
                        <Text style={[
                          styles.playlistNumberText,
                          currentIndex === index && styles.playlistNumberTextActive
                        ]}>
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    <View style={styles.playlistItemInfo}>
                      <Text
                        style={[
                          styles.playlistItemTitle,
                          currentIndex === index && styles.playlistItemTitleActive
                        ]}
                        numberOfLines={2}
                      >
                        {track.title}
                      </Text>
                      <Text style={styles.playlistItemDuration}>
                        {formatTime(track.duration)}
                      </Text>
                    </View>
                  </View>
                  {currentIndex === index && (
                    <Ionicons name="musical-note" size={18} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noPlaylist}>
                <Ionicons name="musical-notes-outline" size={48} color="#CCC" />
                <Text style={styles.noPlaylistText}>No playlist</Text>
              </View>
            )}
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
      </View>

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
      </Animated.ScrollView>

      {showScrollTopButton && (
        <TouchableOpacity style={styles.scrollToTopButton} onPress={handleScrollToTop}>
          <Ionicons name="arrow-up" size={22} color="white" />
        </TouchableOpacity>
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
    backgroundColor: "white",
  },
  screenScrollContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "white",
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
      backgroundColor: "white",
      overflow: "hidden",
    },
  playerTouchable: {
    flex: 1,
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
    width: 90,
    height: 90,
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
  playlistPosition: {
    fontSize: 14,
    color: "#007AFF",
    marginTop: 8,
    fontWeight: "600",
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
    marginHorizontal: 15,
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
  contentContainer: {
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
  playlistContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    minHeight: 300,
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  playlistItemActive: {
    backgroundColor: "#e3f2fd",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  playlistItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  playlistNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  playlistNumberActive: {
    backgroundColor: "#007AFF20",
  },
  playlistNumberText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  playlistNumberTextActive: {
    color: "#007AFF",
  },
  playlistItemInfo: {
    flex: 1,
  },
  playlistItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  playlistItemTitleActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  playlistItemDuration: {
    fontSize: 12,
    color: "#666",
  },
  noPlaylist: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noPlaylistText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
  },
  scrollToTopButton: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
})
