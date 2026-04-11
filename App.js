import "./src/i18n"
import { useEffect, useState, useRef } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { StatusBar } from "expo-status-bar"
import { Ionicons } from "@expo/vector-icons"
import { View } from "react-native"

// Screens
import SplashScreen from "./src/screens/SplashScreen"
import AuthScreen from "./src/screens/AuthScreen"
import RegisterScreen from "./src/screens/RegisterScreen"
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen"
import ProfileScreen from "./src/screens/ProfileScreen"
import AudioPlayerScreen from "./src/screens/AudioPlayerScreen"
import CourseDetailScreen from "./src/screens/CourseDetailScreen"
import SettingsScreen from "./src/screens/SettingsScreen"
import SupportScreen from "./src/screens/SupportScreen"
import HomeScreen from "./src/screens/HomeScreen"
import LibraryScreen from "./src/screens/LibraryScreen"
import BookDetailScreen from "./src/screens/BookDetailScreen"
import CommunityScreen from "./src/screens/CommunityScreen"
import FloatingAudioPlayer from "./src/components/FloatingAudioPlayer"

// Context
import { AuthProvider, useAuth } from "./src/context/AuthContext"
import { AudioProvider } from "./src/context/AudioContext"
import Tabbar from "./src/components/Tabbar"
import { SafeAreaProvider } from "react-native-safe-area-context"

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <Tabbar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  )
}

function AppNavigator({ navigationRef, currentRouteName }) {
  const { user, loading } = useAuth()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (showSplash || loading) {
    return <SplashScreen />
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
              name="AudioPlayer"
              component={AudioPlayerScreen}
              options={{
                presentation: "modal",
                // gestureEnabled: true,
                // cardOverlayEnabled: true,
              }}
            />
            <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
            <Stack.Screen name="BookDetail" component={BookDetailScreen} />
            <Stack.Screen name="Community" component={CommunityScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
          </>
        ) : (
          <Stack.Screen name="AuthFlow" component={AuthNavigator} />
        )}
      </Stack.Navigator>

      {user && (
        <FloatingAudioPlayer
          onPress={() => {
            navigationRef.current?.navigate("AudioPlayer")
          }}
          currentScreenName={currentRouteName}
        />
      )}
    </View>
  )
}

export default function App() {
  const navigationRef = useRef()
  const [currentRouteName, setCurrentRouteName] = useState()

  const onNavigationStateChange = () => {
    const state = navigationRef.current?.getRootState()
    if (state) {
      const route = state.routes[state.index]
      // Handle nested navigators (Tab Navigator)
      if (route.state) {
        const nestedRoute = route.state.routes[route.state.index]
        setCurrentRouteName(nestedRoute.name)
      } else {
        setCurrentRouteName(route.name)
      }
    }
  }

  return (
    <AuthProvider>
      <AudioProvider>
        <SafeAreaProvider>
          <NavigationContainer 
            ref={navigationRef}
            onStateChange={onNavigationStateChange}
          >
            <StatusBar style="auto" />
            <AppNavigator navigationRef={navigationRef} currentRouteName={currentRouteName} />
          </NavigationContainer>
        </SafeAreaProvider>
      </AudioProvider>
    </AuthProvider>
  )
}
