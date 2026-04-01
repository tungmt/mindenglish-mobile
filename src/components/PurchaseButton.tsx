import { useState } from "react"
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { revenueCatService } from "../services/revenueCat"

interface PurchaseButtonProps {
  itemId: string
  itemType: "COURSE" | "LESSON"
  iapProductId?: string
  price?: number
  currency?: string
  isPurchased?: boolean
  onPurchaseSuccess?: () => void
  style?: any
}

export default function PurchaseButton({
  itemId,
  itemType,
  iapProductId,
  price,
  currency = "USD",
  isPurchased = false,
  onPurchaseSuccess,
  style,
}: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false)

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return "Free"
    
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    })
    
    return formatter.format(price)
  }

  const handlePurchase = async () => {
    if (isPurchased) {
      Alert.alert("Already Purchased", "You already own this content.")
      return
    }

    if (!iapProductId) {
      Alert.alert("Error", "This item is not available for purchase.")
      return
    }

    Alert.alert(
      "Confirm Purchase",
      `Purchase this ${itemType.toLowerCase()} for ${formatPrice(price, currency)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Purchase",
          onPress: async () => {
            try {
              setLoading(true)
              
              let success = false
              if (itemType === "COURSE") {
                success = await revenueCatService.purchaseCourse(itemId, iapProductId)
              } else {
                success = await revenueCatService.purchaseLesson(itemId, iapProductId)
              }

              if (success) {
                Alert.alert("Success", "Purchase completed successfully!")
                onPurchaseSuccess?.()
              }
            } catch (error: any) {
              console.error("Purchase error:", error)
              Alert.alert("Purchase Failed", error.message || "Unable to complete purchase. Please try again.")
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  if (isPurchased) {
    return (
      <TouchableOpacity style={[styles.button, styles.buttonPurchased, style]} disabled>
        <Ionicons name="checkmark-circle" size={20} color="#34C759" />
        <Text style={[styles.buttonText, styles.buttonPurchasedText]}>Purchased</Text>
      </TouchableOpacity>
    )
  }

  if (!price || price === 0) {
    return (
      <TouchableOpacity style={[styles.button, styles.buttonFree, style]} disabled>
        <Text style={[styles.buttonText, styles.buttonFreeText]}>Free</Text>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      style={[styles.button, styles.buttonPrimary, style]}
      onPress={handlePurchase}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.buttonText}>{formatPrice(price, currency)}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: "#007AFF",
  },
  buttonPurchased: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#34C759",
  },
  buttonFree: {
    backgroundColor: "#34C759",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonPurchasedText: {
    color: "#34C759",
  },
  buttonFreeText: {
    color: "#fff",
  },
})
