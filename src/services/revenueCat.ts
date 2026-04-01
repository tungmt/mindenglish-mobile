import Purchases, { 
  CustomerInfo, 
  PurchasesPackage, 
  PurchasesOffering 
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { apiService } from './api';

// RevenueCat API Keys (replace with your actual keys)
const REVENUECAT_API_KEY = Platform.select({
  ios: 'YOUR_IOS_API_KEY',
  android: 'YOUR_ANDROID_API_KEY',
}) as string;

class RevenueCatService {
  private initialized = false;

  async initialize(userId: string) {
    if (this.initialized) return;

    try {
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Error getting offerings:', error);
      return null;
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo | null> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('User cancelled purchase');
        return null;
      }
      console.error('Error making purchase:', error);
      throw error;
    }
  }

  async purchaseCourse(courseId: string, iapProductId: string): Promise<boolean> {
    try {
      // Get the offering/package for this product
      const offerings = await this.getOfferings();
      if (!offerings) {
        throw new Error('No offerings available');
      }

      // Find the package matching the product ID
      const packages = offerings.availablePackages;
      const packageToPurchase = packages.find(pkg => pkg.product.identifier === iapProductId);

      if (!packageToPurchase) {
        throw new Error(`Package not found for product ID: ${iapProductId}`);
      }

      // Make the purchase
      const customerInfo = await this.purchasePackage(packageToPurchase);
      
      if (customerInfo) {
        // Verify with backend
        const transactionId = customerInfo.originalPurchaseDate || Date.now().toString();
        await apiService.createPurchase({
          itemId: courseId,
          itemType: 'COURSE',
          transactionId,
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error purchasing course:', error);
      throw error;
    }
  }

  async purchaseLesson(lessonId: string, iapProductId: string): Promise<boolean> {
    try {
      const offerings = await this.getOfferings();
      if (!offerings) {
        throw new Error('No offerings available');
      }

      const packages = offerings.availablePackages;
      const packageToPurchase = packages.find(pkg => pkg.product.identifier === iapProductId);

      if (!packageToPurchase) {
        throw new Error(`Package not found for product ID: ${iapProductId}`);
      }

      const customerInfo = await this.purchasePackage(packageToPurchase);
      
      if (customerInfo) {
        const transactionId = customerInfo.originalPurchaseDate || Date.now().toString();
        await apiService.createPurchase({
          itemId: lessonId,
          itemType: 'LESSON',
          transactionId,
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error purchasing lesson:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Error getting customer info:', error);
      throw error;
    }
  }

  async checkPurchaseStatus(productId: string): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const entitlements = customerInfo.entitlements.active;
      return Object.keys(entitlements).length > 0;
    } catch (error) {
      console.error('Error checking purchase status:', error);
      return false;
    }
  }

  async logout() {
    try {
      await Purchases.logOut();
      this.initialized = false;
    } catch (error) {
      console.error('Error logging out from RevenueCat:', error);
    }
  }
}

export const revenueCatService = new RevenueCatService();
