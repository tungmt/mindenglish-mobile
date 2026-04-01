"use client"

import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Linking } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export default function SupportScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const supportCategories = [
    { id: "technical", title: "Technical Issues", icon: "bug-outline" },
    { id: "account", title: "Account Problems", icon: "person-outline" },
    { id: "billing", title: "Billing & Payments", icon: "card-outline" },
    { id: "content", title: "Course Content", icon: "book-outline" },
    { id: "feature", title: "Feature Request", icon: "bulb-outline" },
    { id: "other", title: "Other", icon: "help-circle-outline" },
  ]

  const faqItems = [
    {
      question: "How do I download lessons for offline listening?",
      answer: "Go to any lesson and tap the download icon. You can also enable auto-download in Settings.",
    },
    {
      question: "Can I change the playback speed?",
      answer: "Yes! Tap the speed button in the audio player to choose from 0.5x to 2x speed.",
    },
    {
      question: "How do I track my learning progress?",
      answer: "Your progress is automatically tracked. Check the Learn tab to see your stats and completed lessons.",
    },
    {
      question: "What if I forget my password?",
      answer: "Use the 'Forgot Password' option on the login screen to reset your password via SMS.",
    },
  ]

  const handleSubmitSupport = async () => {
    if (!selectedCategory || !message.trim()) {
      Alert.alert("Error", "Please select a category and enter your message")
      return
    }

    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      Alert.alert("Support Request Sent", "Thank you for contacting us. We'll get back to you within 24 hours.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ])
    }, 1000)
  }

  const openEmail = () => {
    Linking.openURL("mailto:support@mindenglish.com")
  }

  const openPhone = () => {
    Linking.openURL("tel:+84901234567")
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support & Help</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
              <Ionicons name="mail-outline" size={24} color="#007AFF" />
              <Text style={styles.contactText}>Email Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={openPhone}>
              <Ionicons name="call-outline" size={24} color="#007AFF" />
              <Text style={styles.contactText}>Call Us</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
          ))}
        </View>

        {/* Support Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send us a Message</Text>

          <Text style={styles.formLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {supportCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryButton, selectedCategory === category.id && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={20}
                  color={selectedCategory === category.id ? "white" : "#666"}
                />
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category.id && styles.categoryButtonTextActive,
                  ]}
                >
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Message</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Describe your issue or question..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmitSupport}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>{loading ? "Sending..." : "Send Message"}</Text>
          </TouchableOpacity>
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  contactButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  contactButton: {
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
  contactText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  faqItem: {
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
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryButton: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
    marginHorizontal: "1%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: "#007AFF",
  },
  categoryButtonText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  categoryButtonTextActive: {
    color: "white",
  },
  messageInput: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#333",
    height: 120,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
