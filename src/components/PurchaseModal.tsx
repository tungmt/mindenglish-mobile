import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface PurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  price: number;
  currency: string;
  localizedPrice?: string | null;
  iapProductIdAndroid?: string;
  iapProductIdIos?: string;
  onPurchaseSuccess: () => void;
}

export function PurchaseModal({
  visible,
  onClose,
  title,
  price,
  currency,
  localizedPrice,
  iapProductIdAndroid,
  iapProductIdIos,
  onPurchaseSuccess,
}: PurchaseModalProps) {
  const { t } = useTranslation();
  const [purchasing, setPurchasing] = useState(false);

  const formatPrice = (amount: number, curr: string) => {
    if (curr === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(amount / 100); // Assuming cents
  };

  const handlePurchase = async () => {
    const productId = Platform.OS === 'ios' ? iapProductIdIos : iapProductIdAndroid;
    
    if (!productId) {
      Alert.alert(
        t('purchase.error'),
        t('purchase.product_not_available')
      );
      return;
    }

    setPurchasing(true);
    
    try {
      // This will be called from parent component with the actual purchase logic
      onPurchaseSuccess();
    } catch (error) {
      Alert.alert(
        t('purchase.error'),
        error instanceof Error ? error.message : t('purchase.failed')
      );
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

          {/* Lock Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={48} color="#007AFF" />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('purchase.unlock_course')}</Text>
          <Text style={styles.courseTitle}>{title}</Text>

          {/* Description */}
          <Text style={styles.description}>
            {t('purchase.description')}
          </Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>{t('purchase.price')}</Text>
            <Text style={styles.price}>
              {localizedPrice || formatPrice(price, currency)}
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <FeatureItem icon="checkmark-circle" text={t('purchase.feature_full_access')} />
            <FeatureItem icon="checkmark-circle" text={t('purchase.feature_offline')} />
            <FeatureItem icon="checkmark-circle" text={t('purchase.feature_lifetime')} />
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
            onPress={handlePurchase}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="card-outline" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.purchaseButtonText}>
                  {t('purchase.buy_now')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon as any} size={20} color="#4CAF50" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  purchaseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  buttonIcon: {
    marginRight: 8,
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
