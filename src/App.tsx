import React, { useState, useEffect } from "react";
import { UserProfile, Language, Theme, HistoryItem } from "./types";
import { translations } from "./translations";
import { IPhoneFrame } from "./components/IPhoneFrame";
import { AuthScreen } from "./components/AuthScreen";
import { OnboardingQuestions } from "./components/OnboardingQuestions";
import { MainDashboard } from "./components/MainDashboard";

export default function App() {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<Theme>("light");
  
  // App routing and identity
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize and load persisted "App Memory" data
  useEffect(() => {
    // 1. Language Loader
    const cachedLanguage = localStorage.getItem("sihhatk_language") as Language;
    if (cachedLanguage === "en" || cachedLanguage === "ar") {
      setLanguage(cachedLanguage);
    } else {
      setLanguage("en");
    }

    // 2. Theme Loader
    const cachedTheme = localStorage.getItem("sihhatk_theme") as Theme;
    const initialTheme: Theme = cachedTheme === "dark" || cachedTheme === "light" ? cachedTheme : "light";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 3. User Credentials & Profiles Loader
    const cachedUserStr = localStorage.getItem("sihhatk_active_user");
    if (cachedUserStr) {
      try {
        const parsedUser = JSON.parse(cachedUserStr);
        setUser(parsedUser);
        
        // Load custom profile details tagged to this specific user’s email for multi-user simulation
        const profilePrefix = `sihhatk_profile_${parsedUser.email.replace(/\./g, "_")}`;
        const cachedProfileStr = localStorage.getItem(profilePrefix);
        if (cachedProfileStr) {
          setProfile(JSON.parse(cachedProfileStr));
        }

        // Load custom calorie scan history logs matching this active user
        const historyPrefix = `sihhatk_history_${parsedUser.email.replace(/\./g, "_")}`;
        const cachedHistoryStr = localStorage.getItem(historyPrefix);
        if (cachedHistoryStr) {
          setHistory(JSON.parse(cachedHistoryStr));
        }
      } catch (err) {
        console.error("Error reading saved Sihhatk credentials:", err);
      }
    }
    
    setIsInitialized(true);
  }, []);

  // Update dynamic CSS class tags when theme shifts
  const handleThemeToggle = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("sihhatk_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLanguageToggle = () => {
    const nextLang: Language = language === "en" ? "ar" : "en";
    setLanguage(nextLang);
    localStorage.setItem("sihhatk_language", nextLang);
  };

  const handleAuthSuccess = (activeUser: { email: string; name: string }, isNewUser: boolean) => {
    setUser(activeUser);
    localStorage.setItem("sihhatk_active_user", JSON.stringify(activeUser));

    // Try loading profile for this user
    const profilePrefix = `sihhatk_profile_${activeUser.email.replace(/\./g, "_")}`;
    const savedProfileStr = localStorage.getItem(profilePrefix);
    
    const historyPrefix = `sihhatk_history_${activeUser.email.replace(/\./g, "_")}`;
    const savedHistoryStr = localStorage.getItem(historyPrefix);

    if (savedProfileStr) {
      const parsedProf = JSON.parse(savedProfileStr);
      setProfile(parsedProf);
    } else {
      setProfile(null); // Triggers the onboarding questions
    }

    if (savedHistoryStr) {
      setHistory(JSON.parse(savedHistoryStr));
    } else {
      setHistory([]);
    }
  };

  const handleProfileComplete = (completedProfile: UserProfile) => {
    if (!user) return;
    setProfile(completedProfile);

    const profilePrefix = `sihhatk_profile_${user.email.replace(/\./g, "_")}`;
    localStorage.setItem(profilePrefix, JSON.stringify(completedProfile));
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    if (!user) return;
    setProfile(newProfile);
    const profilePrefix = `sihhatk_profile_${user.email.replace(/\./g, "_")}`;
    localStorage.setItem(profilePrefix, JSON.stringify(newProfile));
  };

  const handleUpdateHistory = (newHistory: HistoryItem[]) => {
    if (!user) return;
    setHistory(newHistory);
    const historyPrefix = `sihhatk_history_${user.email.replace(/\./g, "_")}`;
    localStorage.setItem(historyPrefix, JSON.stringify(newHistory));
  };

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    setHistory([]);
    localStorage.removeItem("sihhatk_active_user");
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-stone-900 text-stone-200 font-sans">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold uppercase tracking-wide">صحتك • Loading sihhatk memory</p>
        </div>
      </div>
    );
  }

  const activeTranslations = translations[language];

  return (
    <IPhoneFrame theme={theme}>
      <div className={`w-full h-full flex flex-col ${language === "ar" ? "rtl" : "ltr"}`}>
        
        {/* Authentication Flow Routing */}
        {!user && (
          <AuthScreen
            translations={activeTranslations}
            language={language}
            onLanguageToggle={handleLanguageToggle}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {/* Questionnaire Flow Onboarding Routing */}
        {user && !profile && (
          <OnboardingQuestions
            translations={activeTranslations}
            language={language}
            initialName={user.name}
            onComplete={handleProfileComplete}
          />
        )}

        {/* Dashboard Main View Routing */}
        {user && profile && (
          <MainDashboard
            translations={activeTranslations}
            language={language}
            theme={theme}
            user={user}
            profile={profile}
            history={history}
            onUpdateProfile={handleUpdateProfile}
            onUpdateHistory={handleUpdateHistory}
            onLanguageToggle={handleLanguageToggle}
            onThemeToggle={handleThemeToggle}
            onLogout={handleLogout}
          />
        )}

      </div>
    </IPhoneFrame>
  );
}
