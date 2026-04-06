"use client"

import { useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Linking } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export default function SupportScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const supportCategories = [
    { id: "technical", title: t('support.cat_technical'), icon: "bug-outline" },
    { id: "account", title: t('support.cat_account'), icon: "person-outline" },
    { id: "billing", title: t('support.cat_billing'), icon: "card-outline" },
    { id: "content", title: t('support.cat_content'), icon: "book-outline" },
    { id: "feature", title: t('support.cat_feature'), icon: "bulb-outline" },
    { id: "other", title: t('support.cat_other'), icon: "help-circle-outline" },
  ]

  const faqItems = [
    { question: t('support.faq1_q'), answer: t('support.faq1_a') },
    { question: t('support.faq2_q'), answer: t('support.faq2_a') },
    { question: t('support.faq3_q'), answer: t('support.faq3_a') },
    { question: t('support.faq4_q'), answer: t('support.faq4_a') },
  ]

  const handleSubmitSupport = async () => {
    if (!selectedCategory || !message.trim()) {
      Alert.alert(t('common.error'), t('support.error_fill'))
      return
    }

    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      Alert.alert(t('support.success_title'), t('support.success_msg'), [
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
        <Text style={styles.headerTitle}>{t('support.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('support.quick_contact')}</Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
              <Ionicons name="mail-outline" size={24} color="#007AFF" />
              <Text style={styles.contactText}>{t('support.email_support')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={openPhone}>
              <Ionicons name="call-outline" size={24} color="#007AFF" />
              <Text style={styles.contactText}>{t('support.call_us')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('support.faq')}</Text>
          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
          ))}
        </View>

        {/* Support Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('support.send_message_title')}</Text>

          <Text style={styles.formLabel}>{t('support.category')}</Text>
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

          <Text style={styles.formLabel}>{t('support.message_label')}</Text>
          <TextInput
            style={styles.messageInput}
            placeholder={t('support.message_placeholder')}
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
            <Text style={styles.submitButtonText}>{loading ? t('support.sending') : t('support.send')}</Text>
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
