import React, { useState, useRef } from "react";
import { UserProfile, Language, AppTranslations, HistoryItem, Theme, FoodAnalysis } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, Upload, Sparkles, Activity, History, User, Heart, 
  Trash2, ShieldCheck, Sun, Moon, Globe, LogOut, Check, Scale, 
  Flame, Award, Apple, ChevronRight, RefreshCw, Layers, ExternalLink 
} from "lucide-react";

interface MainDashboardProps {
  translations: AppTranslations;
  language: Language;
  theme: Theme;
  user: { name: string; email: string };
  profile: UserProfile;
  history: HistoryItem[];
  onUpdateProfile: (newProfile: UserProfile) => void;
  onUpdateHistory: (newHistory: HistoryItem[]) => void;
  onLanguageToggle: () => void;
  onThemeToggle: () => void;
  onLogout: () => void;
}

// Preset meal choices with high-quality nutritionist Unsplash images to test out the application instantly
const PRESET_MEALS = [
  {
    id: "preset_salad",
    titleEn: "Falafel Hummus Salad Plate",
    titleAr: "طبق سلطة فلافل وحمص صحي",
    url: "https://images.unsplash.com/photo-1547058881-aa0edd92aab3?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "preset_toast",
    titleEn: "Avocado Egg Sourdough toast",
    titleAr: "توست الأفوكادو والبيض المسلوق",
    url: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "preset_salmon",
    titleEn: "Grilled Salmon Quinoa Bowl",
    titleAr: "وعاء السلمون المشوي والكينوا",
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400",
  }
];

export function MainDashboard({
  translations, language, theme, user, profile, history,
  onUpdateProfile, onUpdateHistory, onLanguageToggle, onThemeToggle, onLogout
}: MainDashboardProps) {
  const [activeTab, setActiveTab] = useState<"scan" | "history" | "profile">("scan");
  
  // Scanned image states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [activeAnalysis, setActiveAnalysis] = useState<FoodAnalysis | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [analyzeStepIndex, setAnalyzeStepIndex] = useState(0);

  // Profile forms fields
  const [nameField, setNameField] = useState(profile.name);
  const [ageField, setAgeField] = useState(profile.age);
  const [calorieTargetField, setCalorieTargetField] = useState(profile.dailyCalorieTarget);
  const [exerciseField, setExerciseField] = useState(profile.exercise);
  const [gymField, setGymField] = useState(profile.goesToGym);
  const [dietField, setDietField] = useState(profile.followsDiet);
  const [favFoodsField, setFavFoodsField] = useState(profile.favoriteFoods);
  const [profileMessage, setProfileMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps shown in loading loader to prevent being "boring"
  const loadingStepsEn = [
    "Receiving and parsing food photograph portion standards...",
    "Running Gemini Vision Deep Neural Network appraisal...",
    "Scanning carbohydrates, calorie portions, and lipids ratio...",
    "Cross-referencing healthy recipes with USDA Guidelines & NHS databases...",
  ];
  
  const loadingStepsAr = [
    "جاري استقبال ومعالجة أبعاد صورة الطبق...",
    "جاري فحص مكونات الطعام بالذكاء الاصطناعي وبدقة...",
    "حساب كمية الكربوهيدرات والحريرات والدهون والبروتينات...",
    "تحضير ومطابقة الوصفات البديلة بناء على توصيات منظمة الصحة ومؤسسات الغذاء...",
  ];

  // Dynamically calculate Consumed calories for TODAY
  const getTodayConsumedCalories = () => {
    const today = new Date().toDateString();
    return history
      .filter(item => new Date(item.dateTime).toDateString() === today)
      .reduce((acc, current) => acc + current.foodAnalysis.calories, 0);
  };

  const consumedCalories = getTodayConsumedCalories();
  const remainingCalories = Math.max(0, profile.dailyCalorieTarget - consumedCalories);
  const caloriePercent = Math.min(100, (consumedCalories / profile.dailyCalorieTarget) * 100);

  // Convert File object to Base64 easily
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setAnalysisError("");
      try {
        const base64 = await convertFileToBase64(files[0]);
        setSelectedImage(base64);
      } catch (err) {
        setAnalysisError(language === "ar" ? "تعذر قراءة الصورة." : "Failed to read image.");
      }
    }
  };

  // Convert remote Unsplash images to base64 so we can analyze them with Gemini
  const handleSelectPreset = async (url: string) => {
    setAnalysisError("");
    setSelectedImage(null);
    setIsAnalyzing(true);
    setAnalyzeStepIndex(0);

    // Dynamic loader steps rotating interval
    const interval = setInterval(() => {
      setAnalyzeStepIndex((prev) => (prev + 1) % 4);
    }, 2500);

    try {
      // Fetch image remote and encode
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], "preset_meal.jpg", { type: "image/jpeg" });
      const base64 = await convertFileToBase64(file);
      setSelectedImage(base64);
      clearInterval(interval);
      setIsAnalyzing(false);
    } catch (err) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setAnalysisError(
        language === "ar"
          ? "حدث عطل أثناء تشغيل الصورة النموذجية."
          : "Failed to initialize sample image. Please upload a picture from your device."
      );
    }
  };

  // Trigger Gemini Analysis API
  const handleAnalyzeMeal = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalyzeStepIndex(0);

    const interval = setInterval(() => {
      setAnalyzeStepIndex((prev) => (prev + 1) % 4);
    }, 3000);

    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: selectedImage,
          language,
          profile,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server issue analyzing food.");
      }

      const parsedData = (await response.json()) as FoodAnalysis;
      
      // Update local analysis view
      setActiveAnalysis(parsedData);
      setShowResultModal(true);

      // Append to local history list
      const newHistoryItem: HistoryItem = {
        id: "log_" + Date.now().toString(),
        dateTime: new Date().toISOString(),
        imageBase64: selectedImage,
        foodAnalysis: parsedData,
      };

      onUpdateHistory([newHistoryItem, ...history]);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(
        language === "ar" 
          ? "فشل في فحص وجبتك. يرجى التأكد من اتصال الإنترنت وصحة الصورة." 
          : "Could not evaluate nutrients. Please try another cleaner photo or verify connection."
      );
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  // Save updated profile preferences
  const handleUpdateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage("");

    const updatedProfile: UserProfile = {
      name: nameField || "User",
      age: ageField,
      gender: profile.gender,
      dailyCalorieTarget: calorieTargetField,
      exercise: exerciseField,
      goesToGym: gymField,
      followsDiet: dietField,
      favoriteFoods: favFoodsField,
    };

    onUpdateProfile(updatedProfile);
    setProfileMessage(translations.profileSaved);
    setTimeout(() => setProfileMessage(""), 4000);
  };

  const handleClearHistory = () => {
    if (window.confirm(language === "ar" ? "هل ترغب فعلاً في حذف كامل سجل الوجبات؟" : "Are you sure you want to clear your meal log archive?")) {
      onUpdateHistory([]);
    }
  };

  const handleRemoveHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateHistory(history.filter(item => item.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Dynamic Header element */}
      <header className="px-5 py-3 border-b border-stone-100 dark:border-stone-900 flex justify-between items-center bg-white dark:bg-stone-950 z-30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-sm">
            ص
          </div>
          <div>
            <h1 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {language === "ar" ? "صحتك الذكي" : "Sihhatk AI"}
            </h1>
            <p className="text-[10px] text-stone-500 font-medium">
              Fitness App Memory Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Shift Utility */}
          <button 
            onClick={onThemeToggle}
            className="p-1.5 rounded-full hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors text-stone-500 dark:text-stone-400"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          
          {/* Quick Lang Utility */}
          <button 
            onClick={onLanguageToggle}
            className="p-1.5 rounded-full hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors text-stone-500 dark:text-stone-400 font-bold text-xs"
          >
            {language === "en" ? "AR" : "EN"}
          </button>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 overflow-y-auto bg-stone-50/50 dark:bg-stone-900/10">
        
        {activeTab === "scan" && (
          <div className="p-5 space-y-5">
            {/* Greeting and Demographics Cards */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wide text-stone-400">
                  {translations.hiGreeting}
                </p>
                <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                  {profile.name} 👋
                </h2>
              </div>
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full text-[10px] font-bold">
                <Award size={12} />
                <span>Score Rank</span>
              </div>
            </div>

            {/* Calories Ring / Target Health Hub widget */}
            <div className="p-4 rounded-3xl bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-900 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-stone-900 dark:text-stone-200">
                    {translations.trackerTitle}
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    {translations.trackerSubtitle}
                  </p>
                </div>
                <Flame size={18} className="text-orange-500 animate-pulse" />
              </div>

              {/* Progress Level bar */}
              <div className="space-y-1">
                <div className="h-2.5 w-full bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${caloriePercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-stone-500">
                  <span>{consumedCalories} {translations.caloriesKcal} ({Math.round(caloriePercent)}%)</span>
                  <span>{profile.dailyCalorieTarget} {translations.caloriesKcal}</span>
                </div>
              </div>

              {/* Metric Breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 dark:border-stone-900 text-center">
                <div className="bg-stone-50/50 dark:bg-stone-900/10 p-1.5 rounded-xl">
                  <span className="block text-[9px] text-stone-400 font-bold uppercase">{translations.dailyGoal}</span>
                  <span className="text-xs font-black text-stone-850 dark:text-stone-200">{profile.dailyCalorieTarget}</span>
                </div>
                <div className="bg-stone-50/50 dark:bg-stone-900/10 p-1.5 rounded-xl">
                  <span className="block text-[9px] text-stone-400 font-bold uppercase">{translations.eaten}</span>
                  <span className="text-xs font-black text-emerald-500">{consumedCalories}</span>
                </div>
                <div className="bg-stone-50/50 dark:bg-stone-900/10 p-1.5 rounded-xl">
                  <span className="block text-[9px] text-stone-400 font-bold uppercase">{translations.remaining}</span>
                  <span className="text-xs font-black text-orange-500">{remainingCalories}</span>
                </div>
              </div>
            </div>

            {/* Image Selection / Analyzer Container */}
            <div className="p-4 rounded-3xl bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-900 shadow-sm space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-xs font-bold text-stone-900 dark:text-stone-200">
                  {translations.uploadTitle}
                </h3>
                <p className="text-[10px] text-stone-400 leading-normal">
                  {translations.uploadDesc}
                </p>
              </div>

              {/* Upload Interface Box */}
              {!selectedImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors cursor-pointer"
                >
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
                    <Camera size={22} />
                  </div>
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    {translations.uploadBtn}
                  </span>
                  <span className="text-[9px] text-stone-400">
                    JPEG, PNG up to 10MB
                  </span>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-900 bg-stone-50">
                  <img 
                    src={selectedImage} 
                    alt="Preview Meal" 
                    className="w-full h-44 object-cover"
                  />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef}
                onChange={fileChange => handleFileChange(fileChange)}
                accept="image/*"
                className="hidden"
              />

              {/* Preset Foods Choices quick clicks */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-stone-400 uppercase">
                  {language === "ar" ? "أو جرّب إحدى وجباتنا السريعة" : "Or test with preset sample meal"}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_MEALS.map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => handleSelectPreset(pm.url)}
                      className="group relative rounded-xl overflow-hidden h-14 border border-stone-200 dark:border-stone-850 hover:border-emerald-500 focus:outline-none transition-all active:scale-95"
                    >
                      <img src={pm.url} alt="preset" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-1">
                        <span className="text-[8px] font-extrabold text-white text-center leading-normal">
                          {language === "ar" ? pm.titleAr : pm.titleEn}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {analysisError && (
                <p className="text-[10px] text-red-500 leading-normal text-center bg-red-500/5 p-2 rounded-xl border border-red-500/10">
                  {analysisError}
                </p>
              )}

              {/* Action Trigger Button */}
              {selectedImage && !isAnalyzing && (
                <button
                  type="button"
                  onClick={handleAnalyzeMeal}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all uppercase flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  {translations.analyzeBtn}
                </button>
              )}

              {/* Loading Animation States */}
              {isAnalyzing && (
                <div className="py-4 flex flex-col items-center text-center space-y-2.5 bg-stone-50 dark:bg-stone-900 rounded-2xl">
                  <RefreshCw size={24} className="text-emerald-500 animate-spin" />
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {translations.analyzingLoader}
                  </p>
                  <motion.p 
                    key={analyzeStepIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-stone-500 dark:text-stone-400 px-4 leading-normal max-w-[280px]"
                  >
                    {language === "ar" ? loadingStepsAr[analyzeStepIndex] : loadingStepsEn[analyzeStepIndex]}
                  </motion.p>
                </div>
              )}
            </div>

            {/* Quick Healthy Info guidelines panel */}
            <div className="p-4 rounded-3xl bg-stone-900 text-white space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">National food institutions standard</span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-300">
                {language === "ar" 
                  ? "جميع الوصفات والتقديرات الصادرة تلتزم بالإرشادات العامة لوزارة الزراعة الأمريكية (USDA) وهيئة الخدمات الصحية الوطنية (NHS) لضمان موثوقية وجودة التغذية الخاصة بوزنك."
                  : "Nutritional appraising standards operate under direct parameters aligned with global institutions CDC, WHO and USDA guidelines to prioritize balanced metabolism counts."}
              </p>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                  {translations.historyTitle}
                </h2>
                <span className="text-[10px] text-stone-400">{history.length} logged records</span>
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-12 px-6 rounded-3xl bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-900 border-dashed text-center flex flex-col items-center justify-center gap-2">
                <Layers className="text-stone-300 dark:text-stone-800" size={32} />
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-normal max-w-[200px]">
                  {translations.emptyHistory}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveAnalysis(item.foodAnalysis);
                      setShowResultModal(true);
                    }}
                    className="flex p-3 rounded-2xl bg-white dark:bg-stone-950 border border-stone-50 dark:border-stone-900 shadow-sm gap-3 cursor-pointer hover:border-emerald-500/50 transition-colors"
                  >
                    <img 
                      src={item.imageBase64 || "https://images.unsplash.com/photo-1547058881-aa0edd92aab3?auto=format&fit=crop&q=80&w=200"} 
                      alt="Logged dish" 
                      className="w-14 h-14 object-cover rounded-xl shrink-0" 
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-stone-900 dark:text-stone-200 truncate pr-1">
                            {item.foodAnalysis.foodName}
                          </h4>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveHistoryItem(item.id, e)}
                            className="text-stone-300 hover:text-red-500 p-0.5 rounded transition-colors shrink-0"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-400 truncate">
                          {translations.loggedAt} {new Date(item.dateTime).toLocaleDateString(language === "ar" ? "ar-sa" : "en-us", { month: "short", day: "numeric" })}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <span className="text-[10px] font-extrabold text-emerald-500">
                          {item.foodAnalysis.calories} {translations.caloriesKcal}
                        </span>
                        <span className="text-[9px] bg-stone-100 dark:bg-stone-900 text-stone-500 px-1.5 py-0.5 rounded-full font-bold">
                          Score {item.foodAnalysis.healthScore}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="p-5 space-y-4">
            <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
              {translations.profileTitle}
            </h2>

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
              {profileMessage && (
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-center text-xs border border-emerald-500/15">
                  {profileMessage}
                </div>
              )}

              <div className="p-4 rounded-3xl bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-900 shadow-sm space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {translations.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={nameField}
                    onChange={(e) => setNameField(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3.5 py-2 text-xs focus:border-emerald-500 focus:outline-none dark:text-stone-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      {translations.ageLabel}
                    </label>
                    <input
                      type="number"
                      value={ageField}
                      onChange={(e) => setAgeField(parseInt(e.target.value) || 25)}
                      className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3.5 py-2 text-xs focus:border-emerald-500 focus:outline-none dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      {translations.calorieTargetLabel}
                    </label>
                    <input
                      type="number"
                      value={calorieTargetField}
                      onChange={(e) => setCalorieTargetField(parseInt(e.target.value) || 2000)}
                      className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3.5 py-2 text-xs focus:border-emerald-500 focus:outline-none dark:text-stone-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {translations.exerciseLabel}
                  </label>
                  <select
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3.5 py-2.5 text-xs focus:border-emerald-500 focus:outline-none dark:text-stone-100"
                    value={exerciseField}
                    onChange={(e) => setExerciseField(e.target.value)}
                  >
                    <option value="none">{translations.exNone}</option>
                    <option value="light">{translations.exLight}</option>
                    <option value="moderate">{translations.exMod}</option>
                    <option value="heavy">{translations.exHeavy}</option>
                  </select>
                </div>

                {/* Sub Toggles */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-stone-600 dark:text-stone-400 font-semibold">{translations.gymLabel}</span>
                  <input
                    type="checkbox"
                    checked={gymField}
                    onChange={(e) => setGymField(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 accent-emerald-500 rounded focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-stone-600 dark:text-stone-400 font-semibold">{translations.dietLabel}</span>
                  <input
                    type="checkbox"
                    checked={dietField}
                    onChange={(e) => setDietField(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 accent-emerald-500 rounded focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                    {translations.favFoodsLabel}
                  </label>
                  <input
                    type="text"
                    value={favFoodsField}
                    onChange={(e) => setFavFoodsField(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3.5 py-2 text-xs focus:border-emerald-500 focus:outline-none dark:text-stone-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer select-none"
              >
                {translations.saveBtn}
              </button>
            </form>

            {/* Logout Option block */}
            <button
              onClick={onLogout}
              className="w-full py-2.5 border border-red-500/20 text-red-500 bg-red-550/5 hover:bg-red-500 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-4"
            >
              <LogOut size={14} />
              <span>{translations.logoutBtn}</span>
            </button>
          </div>
        )}
      </main>

      {/* Slide-Up Overlay Modal: Detailed Food Appraisal Results */}
      <AnimatePresence>
        {showResultModal && activeAnalysis && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="absolute inset-[44px_0_0_0] bg-white dark:bg-stone-950 z-50 flex flex-col rounded-t-[32px] shadow-[0_-20px_50px_rgba(0,0,0,0.25)] border-t border-stone-100 dark:border-stone-900"
          >
            {/* Modal Header Panel */}
            <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-900 flex justify-between items-center sticky top-0 bg-white dark:bg-stone-950 rounded-t-[32px] shrink-0">
              <div>
                <h3 className="text-sm font-bold text-stone-950 dark:text-stone-100">
                  {translations.resultTitle}
                </h3>
                <span className="text-[10px] text-stone-400">
                  {translations.confidenceLabel}: {activeAnalysis.confidence}
                </span>
              </div>
              <button 
                onClick={() => setShowResultModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors text-stone-500 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Scroll */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* Main Food Accent details */}
              <div className="text-center space-y-1 bg-stone-50 dark:bg-stone-900/60 p-4 rounded-3xl">
                <h4 className="text-base font-extrabold text-stone-900 dark:text-stone-100 leading-tight">
                  {activeAnalysis.foodName}
                </h4>
                
                {/* Score rating meter */}
                <div className="flex justify-center items-center gap-3 pt-2">
                  <div className="flex flex-col items-center">
                    <span className="text-[26px] font-black tracking-tighter text-emerald-500 font-mono">
                      {activeAnalysis.healthScore}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-stone-400">
                      {translations.healthScore}
                    </span>
                  </div>
                  
                  {/* Vertical bar dividing */}
                  <div className="h-8 w-[1px] bg-stone-200 dark:bg-stone-800"></div>

                  <div className="flex flex-col items-center">
                    <span className="text-[26px] font-black tracking-tighter text-amber-500 font-mono">
                      {activeAnalysis.calories}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-stone-400">
                      {translations.caloriesKcal}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap justify-center gap-1.5 pt-3">
                  {activeAnalysis.nutritionalHighlights.map((tag, idx) => (
                    <span key={idx} className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded-full uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Macro Bars */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-stone-50/50 dark:bg-stone-900/10 border border-stone-50 dark:border-stone-900 p-3 rounded-2xl space-y-1">
                  <span className="block text-[9px] text-stone-400 font-bold uppercase">{translations.carbsLabel}</span>
                  <span className="text-xs font-black text-amber-500 font-mono">{activeAnalysis.carbohydrates}g</span>
                  <div className="h-1 w-full bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, activeAnalysis.carbohydrates * 1.5)}%` }}></div>
                  </div>
                </div>
                
                <div className="bg-stone-50/50 dark:bg-stone-900/10 border border-stone-50 dark:border-stone-900 p-3 rounded-2xl space-y-1">
                  <span className="block text-[9px] text-stone-400 font-bold uppercase">{translations.proteinLabel}</span>
                  <span className="text-xs font-black text-emerald-500 font-mono">{activeAnalysis.protein}g</span>
                  <div className="h-1 w-full bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, activeAnalysis.protein * 2.5)}%` }}></div>
                  </div>
                </div>

                <div className="bg-stone-50/50 dark:bg-stone-900/10 border border-stone-50 dark:border-stone-900 p-3 rounded-2xl space-y-1">
                  <span className="block text-[9px] text-stone-400 font-bold uppercase">{translations.fatLabel}</span>
                  <span className="text-xs font-black text-rose-500 font-mono">{activeAnalysis.fat}g</span>
                  <div className="h-1 w-full bg-stone-100 dark:bg-stone-900 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-400 rounded-full" style={{ width: `${Math.min(100, activeAnalysis.fat * 3.5)}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Advanced Micros Box */}
              {(activeAnalysis.fiber || activeAnalysis.sugar || activeAnalysis.sodium) && (
                <div className="p-3 bg-stone-50/50 dark:bg-stone-900/10 border border-stone-50 dark:border-stone-900 rounded-2xl grid grid-cols-3 text-center">
                  <div>
                    <span className="block text-[9px] text-stone-400 font-bold">{translations.fiberLabel}</span>
                    <span className="text-xs font-extrabold text-stone-850 dark:text-stone-300 font-mono">{activeAnalysis.fiber || 0}g</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-stone-400 font-bold">{translations.sugarLabel}</span>
                    <span className="text-xs font-extrabold text-stone-850 dark:text-stone-300 font-mono">{activeAnalysis.sugar || 0}g</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-stone-400 font-bold">{translations.sodiumLabel}</span>
                    <span className="text-xs font-extrabold text-stone-850 dark:text-stone-300 font-mono">{activeAnalysis.sodium || 0}mg</span>
                  </div>
                </div>
              )}

              {/* Insights review */}
              <div className="space-y-1">
                <h5 className="text-xs font-extrabold text-stone-850 dark:text-stone-300 uppercase tracking-wider">
                  {translations.insightsTitle}
                </h5>
                <p className="text-[11px] leading-relaxed text-stone-600 dark:text-stone-400 bg-stone-50/30 dark:bg-stone-900/10 p-3 rounded-2xl border border-stone-50 dark:border-stone-900">
                  {activeAnalysis.nutritionalSummary}
                </p>
              </div>

              {/* Recipes Suggestions */}
              <div className="space-y-3 pt-1">
                <h5 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Apple size={14} />
                  <span>{translations.recipeTitle}</span>
                </h5>

                <div className="space-y-4">
                  {activeAnalysis.suggestedRecipes.map((recipe, index) => (
                    <div key={index} className="p-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 space-y-2">
                      <div className="flex justify-between items-start gap-1 pb-1.5 border-b border-emerald-500/10">
                        <h6 className="text-xs font-black text-stone-900 dark:text-stone-100 pr-1 leading-snug">
                          {recipe.recipeName}
                        </h6>
                        <span className="text-[9px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full font-mono whitespace-nowrap shrink-0">
                          {recipe.calories} kcal
                        </span>
                      </div>

                      {/* Benefits & Official Source Attribution */}
                      <p className="text-[10px] text-stone-600 dark:text-stone-400 italic leading-snug">
                        {recipe.benefits}
                      </p>

                      <div className="py-1 px-2.5 bg-white dark:bg-stone-950 rounded-lg flex items-center justify-between text-[8px] font-bold text-stone-500 border border-stone-100 dark:border-stone-900">
                        <span>{translations.recipeSource}:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 capitalize flex items-center gap-0.5">
                          {recipe.source}
                          <ExternalLink size={8} />
                        </span>
                      </div>

                      {/* Ingredients list */}
                      <div className="space-y-0.5 pt-1">
                        <span className="block text-[9px] text-stone-500 font-bold">{translations.ingredientsTitle}:</span>
                        <ul className="list-disc list-inside text-[9.5px] text-stone-600 dark:text-stone-400 space-y-0.5">
                          {recipe.ingredients.map((ing, iIdx) => (
                            <li key={iIdx}>{ing}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Instructions details */}
                      <div className="space-y-0.5">
                        <span className="block text-[9px] text-stone-500 font-bold">{translations.instructionsTitle}:</span>
                        <p className="text-[9.5px] leading-relaxed text-stone-600 dark:text-stone-400">
                          {recipe.instructions}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Save and Close Button */}
            <div className="p-4 border-t border-stone-100 dark:border-stone-900 flex sticky bottom-0 bg-white dark:bg-stone-950 rounded-b-3xl">
              <button
                onClick={() => setShowResultModal(false)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all uppercase"
              >
                {translations.closeBtn}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Standard Apple iOS bottom Tab Layout Navigation Bar bar */}
      <nav className="h-14 border-t border-stone-100 dark:border-stone-900 flex items-center justify-around bg-white dark:bg-stone-950 shrink-0 z-40 select-none pb-1">
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex flex-col items-center gap-1 transition-all focus:outline-none ${
            activeTab === "scan"
              ? "text-emerald-500 scale-105 font-bold"
              : "text-stone-400 dark:text-stone-500 hover:text-stone-600"
          }`}
        >
          <Camera size={18} />
          <span className="text-[8.5px] uppercase font-bold tracking-wider">{translations.navHome}</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center gap-1 transition-all focus:outline-none ${
            activeTab === "history"
              ? "text-emerald-500 scale-105 font-bold"
              : "text-stone-400 dark:text-stone-500 hover:text-stone-600"
          }`}
        >
          <History size={18} />
          <span className="text-[8.5px] uppercase font-bold tracking-wider">{translations.navHistory}</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 transition-all focus:outline-none ${
            activeTab === "profile"
              ? "text-emerald-500 scale-105 font-bold"
              : "text-stone-400 dark:text-stone-500 hover:text-stone-600"
          }`}
        >
          <User size={18} />
          <span className="text-[8.5px] uppercase font-bold tracking-wider">{translations.navProfile}</span>
        </button>
      </nav>
    </div>
  );
}
