"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAudio } from "../context/AudioContext"

interface FloatingAudioPlayerProps {
  onPress: () => void
}

export default function FloatingAudioPlayer({ onPress }: FloatingAudioPlayerProps) {
  const { currentTrack, isPlaying, pauseTrack, resumeTrack, position, duration } = useAudio()
  const [isMinimized, setIsMinimized] = useState(false)

  if (!currentTrack) return null

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack()
    } else {
      resumeTrack()
    }
  }

  const progress = duration > 0 ? (position / duration) * 100 : 0

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.content}>
        <Image
          source={{
            uri: `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(currentTrack.title.slice(0, 2))}`,
          }}
          style={styles.thumbnail}
        />

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            MindEnglish
          </Text>
        </View>

        <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={() => {}}>
          <Ionicons name="close" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 90, // Above tab bar
    left: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: 2,
    backgroundColor: "#e0e0e0",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
})
