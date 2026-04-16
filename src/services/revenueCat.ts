import { Platform } from 'react-native';
import { apiService } from './api';

// Safely import Purchases - it may not be available if not properly linked
let Purchases: any = null;
let CustomerInfo: any = null;
let PurchasesPackage: any = null;
let PurchasesOffering: any = null;

try {
  const PurchasesModule = require('react-native-purchases');
  Purchases = PurchasesModule.default || PurchasesModule.Purchases;
  CustomerInfo = PurchasesModule.CustomerInfo;
  PurchasesPackage = PurchasesModule.PurchasesPackage;
  PurchasesOffering = PurchasesModule.PurchasesOffering;
} catch (error) {
  console.log('RevenueCat module not available - purchases will be disabled:', error);
}

// RevenueCat API Keys (replace with your actual keys)
const REVENUECAT_API_KEY = Platform.select({
  ios: 'YOUR_IOS_API_KEY',
  android: 'YOUR_ANDROID_API_KEY',
}) as string;

class RevenueCatService {
  private initialized = false;
  private available = false;

  constructor() {
    this.available = Purchases !== null;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async initialize(userId: string) {
    if (!this.available) {
      console.log('RevenueCat module not available - skipping initialization');
      return;
    }

    if (this.initialized) return;

    try {
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.log('Error initializing RevenueCat:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<any | null> {
    if (!this.available) {
      console.log('RevenueCat not available');
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.log('Error getting offerings:', error);
      return null;
    }
  }

  async purchasePackage(packageToPurchase: any): Promise<any | null> {
    if (!this.available) {
      throw new Error('Purchases are not available on this device');
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('User cancelled purchase');
        return null;
      }
      console.log('Error making purchase:', error);
      throw error;
    }
  }

  async purchaseCourse(courseId: string, iapProductId: string): Promise<boolean> {
    if (!this.available) {
      throw new Error('Purchases are not available on this device');
    }

    try {
      // Get the offering/package for this product
      const offerings = await this.getOfferings();
      if (!offerings) {
        throw new Error('No offerings available');
      }

      // Find the package matching the product ID
      const packages = offerings.availablePackages;
      const packageToPurchase = packages.find((pkg: any) => pkg.product.identifier === iapProductId);

      if (!packageToPurchase) {
        throw new Error(`Package not found for product ID: ${iapProductId}`);
      }

      // Make the purchase
      const customerInfo = await this.purchasePackage(packageToPurchase);
      
      if (customerInfo) {
        // Verify with backend
        const transactionId = customerInfo.originalPurchaseDate || Date.now().toString();
        await apiService.createPurchase({
          courseId,
          transactionId,
        } as any);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Error purchasing course:', error);
      throw error;
    }
  }

  async purchaseLesson(lessonId: string, iapProductId: string): Promise<boolean> {
    if (!this.available) {
      throw new Error('Purchases are not available on this device');
    }

    try {
      const offerings = await this.getOfferings();
      if (!offerings) {
        throw new Error('No offerings available');
      }

      const packages = offerings.availablePackages;
      const packageToPurchase = packages.find((pkg: any) => pkg.product.identifier === iapProductId);

      if (!packageToPurchase) {
        throw new Error(`Package not found for product ID: ${iapProductId}`);
      }

      const customerInfo = await this.purchasePackage(packageToPurchase);
      
      if (customerInfo) {
        const transactionId = customerInfo.originalPurchaseDate || Date.now().toString();
        await apiService.createPurchase({
          postId: lessonId,
          transactionId,
        } as any);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Error purchasing lesson:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<any> {
    if (!this.available) {
      throw new Error('Purchases are not available on this device');
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.log('Error restoring purchases:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<any> {
    if (!this.available) {
      throw new Error('Purchases are not available on this device');
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.log('Error getting customer info:', error);
      throw error;
    }
  }

  async checkPurchaseStatus(productId: string): Promise<boolean> {
    if (!this.available) {
      return false;
    }

    try {
      const customerInfo = await this.getCustomerInfo();
      const entitlements = customerInfo.entitlements.active;
      return Object.keys(entitlements).length > 0;
    } catch (error) {
      console.log('Error checking purchase status:', error);
      return false;
    }
  }

  async logout() {
    if (!this.available) {
      return;
    }

    try {
      await Purchases.logOut();
      this.initialized = false;
    } catch (error) {
      console.log('Error logging out from RevenueCat:', error);
    }
  }
}

export const revenueCatService = new RevenueCatService();
