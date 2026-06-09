import React, { useState } from "react";
import { UserProfile, Language, AppTranslations } from "../types";
import { motion } from "motion/react";
import { Sparkles, Trophy, Target, ChevronRight, ChevronLeft, Dumbbell, ShieldAlert } from "lucide-react";

interface OnboardingQuestionsProps {
  translations: AppTranslations;
  language: Language;
  onComplete: (profile: UserProfile) => void;
  initialName?: string;
}

export function OnboardingQuestions({ translations, language, onComplete, initialName = "" }: OnboardingQuestionsProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialName);
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [calorieTarget, setCalorieTarget] = useState<number>(2000);
  const [exercise, setExercise] = useState<string>("moderate");
  const [goesToGym, setGoesToGym] = useState<boolean>(false);
  const [followsDiet, setFollowsDiet] = useState<boolean>(false);
  const [favoriteFoods, setFavoriteFoods] = useState<string>("");

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      const finalProfile: UserProfile = {
        name: name || "Nutrition Friend",
        age,
        gender,
        dailyCalorieTarget: calorieTarget,
        exercise,
        goesToGym,
        followsDiet,
        favoriteFoods,
      };
      onComplete(finalProfile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Dynamically calculate recommended calories based on Age/Gender/Exercise as a clever helper
  const handleAutoCalculate = () => {
    let base = gender === "male" ? 1800 : gender === "female" ? 1600 : 1700;
    // Activity modifiers
    if (exercise === "none") base += 100;
    else if (exercise === "light") base += 350;
    else if (exercise === "moderate") base += 600;
    else if (exercise === "heavy") base += 900;
    
    if (goesToGym) base += 250;
    if (age < 30) base += 100;
    else if (age > 50) base -= 150;

    setCalorieTarget(base);
  };

  const stepProgressWidth = `${(step / totalSteps) * 100}%`;

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-between">
      {/* Step Header Indicator */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold tracking-wide text-stone-500 uppercase">
            {translations.questionsTitle}
          </h2>
          <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-1 rounded-full">
            {step} / {totalSteps}
          </span>
        </div>
        
        {/* Progress Bar element */}
        <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full mb-6">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: stepProgressWidth }}
          ></div>
        </div>
      </div>

      {/* Dynamic Animated Core Body of Questions */}
      <div className="flex-1 flex flex-col justify-center my-2">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-emerald-500 text-white rounded-full shadow-lg">
                <Target size={28} />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {language === "ar" ? "أهلاً بك، لنتعرف عليك!" : "Hi! Let's get acquainted"}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {translations.questionsSubtitle}
              </p>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  {translations.nameLabel}
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:text-stone-100"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Abdullah"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  {translations.ageLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:text-stone-100"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center mb-2">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {translations.genderLabel}
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(["male", "female", "other"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-3 px-2 rounded-2xl border text-sm font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
                    gender === g
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm"
                      : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900"
                  }`}
                >
                  <span className="text-xs uppercase">
                    {g === "male"
                      ? translations.maleOpt
                      : g === "female"
                      ? translations.femaleOpt
                      : translations.otherOpt}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-2 mt-4">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                {translations.calorieTargetLabel}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="50"
                  className="flex-1 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none dark:text-stone-100 font-mono text-center font-bold"
                  value={calorieTarget}
                  onChange={(e) => setCalorieTarget(parseInt(e.target.value) || 2000)}
                />
                <button
                  type="button"
                  onClick={handleAutoCalculate}
                  className="px-3 py-2 bg-stone-100 dark:bg-stone-850 hover:bg-emerald-550 hover:text-white border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors dark:text-stone-200"
                >
                  <Sparkles size={14} className="text-emerald-500" />
                  {language === "ar" ? "حساب تلقائي" : "Auto Calc"}
                </button>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                {language === "ar" 
                  ? "سيقوم الذكاء الاصطناعي باحتساب سعراتك تلقائياً بناء على عمرك، جنسك ومعدل رياضتك."
                  : "Calculation leverages metabolic formulas for custom energy levels based on demographics."}
              </p>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center mb-2">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {translations.exerciseLabel}
              </h3>
            </div>

            <div className="space-y-2.5">
              {[
                { key: "none", label: translations.exNone },
                { key: "light", label: translations.exLight },
                { key: "moderate", label: translations.exMod },
                { key: "heavy", label: translations.exHeavy },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setExercise(item.key)}
                  className={`w-full py-2.5 px-4 rounded-xl border text-left text-xs transition-all duration-200 flex items-center justify-between ${
                    exercise === item.key
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold"
                      : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-300"
                  } ${language === "ar" ? "text-right flex-row-reverse" : "text-left"}`}
                >
                  <span>{item.label}</span>
                  {exercise === item.key && (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Gym Attendance Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-850 mt-4 bg-stone-50/50 dark:bg-stone-900/30">
              <div className="flex items-center gap-2">
                <Dumbbell size={16} className="text-stone-400 dark:text-stone-500" />
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  {translations.gymLabel}
                </span>
              </div>
              <input
                type="checkbox"
                checked={goesToGym}
                onChange={(e) => setGoesToGym(e.target.checked)}
                className="w-4 h-4 text-emerald-500 accent-emerald-500 rounded focus:ring-emerald-500"
              />
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center mb-2">
              <div className="flex justify-center mb-2">
                <div className="p-2.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full">
                  <Trophy size={24} />
                </div>
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {language === "ar" ? "الأهداف والأطعمة المفضلة" : "Daily Diet & Taste"}
              </h3>
            </div>

            {/* Diet routine Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-850 bg-stone-50/50 dark:bg-stone-900/10">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                {translations.dietLabel}
              </span>
              <input
                type="checkbox"
                checked={followsDiet}
                onChange={(e) => setFollowsDiet(e.target.checked)}
                className="w-4 h-4 text-emerald-500 accent-emerald-500 rounded focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                {translations.favFoodsLabel}
              </label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none dark:text-stone-100"
                value={favoriteFoods}
                onChange={(e) => setFavoriteFoods(e.target.value)}
                placeholder={language === "ar" ? "مثال: الحمص، المنسف، السلطات، دجاج مشوي" : "e.g. Hummus, Grill Chicken, Greek salads"}
              />
            </div>

            <div className="p-3 bg-red-500/5 stroke-red-200/10 border border-red-500/10 rounded-xl flex gap-2">
              <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={16} />
              <p className="text-[10px] text-red-500 leading-normal">
                {translations.warningSensitive}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Navigation Buttons for Onboarding Questionnaire */}
      <div className="flex items-center gap-3 pt-4 border-t border-stone-100 dark:border-stone-900">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 py-2.5 px-4 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 dark:text-stone-200"
          >
            {language === "ar" ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            {translations.back}
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleNext}
          className="flex-[2] py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          {step === totalSteps ? translations.submitProfile : translations.next}
          {step < totalSteps && (language === "ar" ? <ChevronLeft size={14} /> : <ChevronRight size={14} />)}
        </button>
      </div>
    </div>
  );
}
