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

const REVENUECAT_API_KEY = Platform.select({
  ios: 'appl_ysoPKZmaCxGAJjCguPKyVTdvfJa',
  android: 'goog_UDOJAjTgfBdNrbMPpTOwivQtwvP',
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

  async getProductInfo(iapProductId: string): Promise<{ price: string; priceString: string; currencyCode: string } | null> {
    if (!this.available) {
      console.log('RevenueCat not available');
      return null;
    }

    // Ensure RevenueCat is initialized before fetching products
    if (!this.initialized) {
      console.log('⚠️ RevenueCat not initialized, attempting to initialize with anonymous user...');
      try {
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        this.initialized = true;
        console.log('✅ RevenueCat initialized successfully');
      } catch (error) {
        console.log('❌ Failed to initialize RevenueCat:', error);
        return null;
      }
    }

    try {
      console.log('🔍 Fetching product info for:', iapProductId);
      
      // Get products directly by product ID (more reliable than offerings)
      const products = await Purchases.getProducts([iapProductId]);
      
      if (!products || products.length === 0) {
        console.log('❌ No products found for ID:', iapProductId);
        return null;
      }

      const product = products[0];
      console.log('✅ Product found:', {
        identifier: product.identifier,
        price: product.price,
        priceString: product.priceString,
        currencyCode: product.currencyCode,
      });

      return {
        price: product.price,
        priceString: product.priceString, // Localized price string (e.g., "$9.99", "₫99,000")
        currencyCode: product.currencyCode,
      };
    } catch (error) {
      console.log('❌ Error getting product info:', error);
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

    // Ensure RevenueCat is initialized
    if (!this.initialized) {
      console.log('⚠️ RevenueCat not initialized, attempting to initialize...');
      try {
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        this.initialized = true;
        console.log('✅ RevenueCat initialized successfully');
      } catch (error) {
        console.log('❌ Failed to initialize RevenueCat:', error);
        throw new Error('Failed to initialize payment system');
      }
    }

    try {
      console.log('🛒 Starting purchase for course:', courseId, 'product:', iapProductId);
      
      // Get the product directly by ID
      const products = await Purchases.getProducts([iapProductId]);
      if (!products || products.length === 0) {
        throw new Error(`Product not found for ID: ${iapProductId}`);
      }

      const product = products[0];
      console.log('✅ Product found, initiating purchase...');

      // Make the purchase directly with the product
      const { customerInfo } = await Purchases.purchaseStoreProduct(product);
      
      if (customerInfo) {
        console.log('✅ Purchase successful, syncing with backend...');
        // Verify with backend
        const transactionId = customerInfo.originalPurchaseDate || Date.now().toString();
        await apiService.createPurchase({
          courseId,
          transactionId,
        } as any);
        
        console.log('✅ Purchase synced with backend');
        return true;
      }
      
      return false;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('ℹ️ User cancelled purchase');
        return false;
      }
      console.log('❌ Error purchasing course:', error);
      throw error;
    }
  }

  async purchaseBook(bookId: string, iapProductId: string): Promise<boolean> {
    if (!this.available) {
      throw new Error('Purchases are not available on this device');
    }

    // Ensure RevenueCat is initialized
    if (!this.initialized) {
      console.log('⚠️ RevenueCat not initialized, attempting to initialize...');
      try {
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        this.initialized = true;
        console.log('✅ RevenueCat initialized successfully');
      } catch (error) {
        console.log('❌ Failed to initialize RevenueCat:', error);
        throw new Error('Failed to initialize payment system');
      }
    }

    try {
      console.log('🛒 Starting purchase for book:', bookId, 'product:', iapProductId);
      
      // Get the product directly by ID
      const products = await Purchases.getProducts([iapProductId]);
      if (!products || products.length === 0) {
        throw new Error(`Product not found for ID: ${iapProductId}`);
      }

      const product = products[0];
      console.log('✅ Product found, initiating purchase...');

      // Make the purchase directly with the product
      const { customerInfo } = await Purchases.purchaseStoreProduct(product);
      
      if (customerInfo) {
        console.log('✅ Purchase successful, syncing with backend...');
        // Verify with backend
        const transactionId = customerInfo.originalPurchaseDate || Date.now().toString();
        await apiService.createPurchase({
          bookId,
          transactionId,
        } as any);
        
        console.log('✅ Purchase synced with backend');
        return true;
      }
      
      return false;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('ℹ️ User cancelled purchase');
        return false;
      }
      console.log('❌ Error purchasing book:', error);
      throw error;
    }
  }

  async purchaseLesson(lessonId: string, iapProductId: string): Promise<boolean> {
    if (!this.available) {
      throw new Error('Purchases are not available on this device');
    }

    // Ensure RevenueCat is initialized
    if (!this.initialized) {
      console.log('⚠️ RevenueCat not initialized, attempting to initialize...');
      try {
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        this.initialized = true;
        console.log('✅ RevenueCat initialized successfully');
      } catch (error) {
        console.log('❌ Failed to initialize RevenueCat:', error);
        throw new Error('Failed to initialize payment system');
      }
    }

    try {
      console.log('🛒 Starting purchase for lesson:', lessonId, 'product:', iapProductId);
      
      // Get the product directly by ID
      const products = await Purchases.getProducts([iapProductId]);
      if (!products || products.length === 0) {
        throw new Error(`Product not found for ID: ${iapProductId}`);
      }

      const product = products[0];
      console.log('✅ Product found, initiating purchase...');

      // Make the purchase directly with the product
      const { customerInfo } = await Purchases.purchaseStoreProduct(product);
      
      if (customerInfo) {
        console.log('✅ Purchase successful, syncing with backend...');
        const transactionId = customerInfo.originalPurchaseDate || Date.now().toString();
        await apiService.createPurchase({
          postId: lessonId,
          transactionId,
        } as any);
        
        console.log('✅ Purchase synced with backend');
        return true;
      }
      
      return false;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('ℹ️ User cancelled purchase');
        return false;
      }
      console.log('❌ Error purchasing lesson:', error);
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
