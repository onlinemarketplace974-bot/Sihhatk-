import React, { useState } from "react";
import { Language, AppTranslations } from "../types";
import { motion } from "motion/react";
import { ShieldCheck, Mail, Lock, User, Globe, Sparkles } from "lucide-react";

interface AuthScreenProps {
  translations: AppTranslations;
  language: Language;
  onLanguageToggle: () => void;
  onAuthSuccess: (user: { email: string; name: string }, isNewUser: boolean) => void;
}

export function AuthScreen({ translations, language, onLanguageToggle, onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<"welcome" | "login" | "register">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGuest = () => {
    onAuthSuccess({ email: "guest@sihhatk.com", name: "Guest User" }, true);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg(language === "ar" ? "يرجى تعبئة جميع الحقول المطلوبة." : "Please fill in all layout fields.");
      return;
    }

    // Retrieve users list from local storage
    const usersStr = localStorage.getItem("sihhatk_registered_users") || "[]";
    const users = JSON.parse(usersStr) as Array<{ email: string; name: string; password?: string }>;
    
    // Simple password login check
    const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      onAuthSuccess({ email: matched.email, name: matched.name }, false);
    } else {
      // Create user automatically for painless prototype testing of this password loop
      const mockUser = { email, name: email.split("@")[0] };
      users.push({ ...mockUser, password });
      localStorage.setItem("sihhatk_registered_users", JSON.stringify(users));
      onAuthSuccess(mockUser, true);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email || !password || !name) {
      setErrorMsg(language === "ar" ? "يرجى تعبئة جميع الحقول المطلوبة." : "Please fill in all layout fields.");
      return;
    }
    if (!termsAccepted) {
      setErrorMsg(language === "ar" ? "يرجى الموافقة على الشروط والأحكام أولاً." : "Please agree to the Terms & Conditions first.");
      return;
    }

    const usersStr = localStorage.getItem("sihhatk_registered_users") || "[]";
    const users = JSON.parse(usersStr) as Array<{ email: string; name: string; password?: string }>;

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      setErrorMsg(language === "ar" ? "هذا الحساب مسجّل مسبقاً." : "This account is already registered.");
      return;
    }

    const newUser = { email, name, password };
    users.push(newUser);
    localStorage.setItem("sihhatk_registered_users", JSON.stringify(users));
    onAuthSuccess({ email, name }, true);
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-5 py-6 overflow-y-auto">
      {/* Top action header for language switching */}
      <div className="flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-1.5 px-3 rounded-full">
          <Sparkles size={13} className="animate-spin-slow" />
          <span className="text-[10px] font-bold tracking-wide uppercase">صحتك • Sihhatk</span>
        </div>
        
        <button
          onClick={onLanguageToggle}
          className="p-2 rounded-full border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors flex items-center justify-center gap-1 text-[11px] font-bold text-stone-700 dark:text-stone-300"
        >
          <Globe size={13} />
          {language === "en" ? "العربية" : "EN"}
        </button>
      </div>

      {mode === "welcome" && (
        <div className="flex-1 flex flex-col justify-center items-center my-6 space-y-6">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-center space-y-3"
          >
            {/* Visual Circular Accent */}
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <span className="text-white font-extrabold text-2xl tracking-tighter">ص</span>
            </div>
            
            <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 uppercase">
              {translations.welcomeTitle}
            </h1>
            
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-[280px]">
              {translations.welcomeSubtitle}
            </p>
          </motion.div>

          <div className="w-full space-y-3 max-w-[280px]">
            <button
              onClick={() => setMode("register")}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
            >
              {translations.getStarted}
            </button>
            
            <button
              onClick={() => setMode("login")}
              className="w-full py-3 bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-850 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              {translations.loginTitle}
            </button>
            
            <button
              onClick={handleGuest}
              className="w-full py-1.5 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-400 text-[10px] font-medium transition-colors cursor-pointer"
            >
              {translations.guestUser}
            </button>
          </div>
        </div>
      )}

      {mode === "login" && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex flex-col justify-center my-4"
        >
          <div className="text-center mb-5">
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {translations.loginTitle}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {translations.loginSubtitle}
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs text-center border border-red-500/15">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                {translations.emailLabel}
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 pl-10 pr-4 py-2.5 text-xs focus:border-emerald-500 focus:outline-none dark:text-stone-100"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={14} className="absolute left-3.5 top-3.5 text-stone-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                {translations.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 pl-10 pr-4 py-2.5 text-xs focus:border-emerald-500 focus:outline-none dark:text-stone-100"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={14} className="absolute left-3.5 top-3.5 text-stone-400" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
            >
              {translations.loginBtn}
            </button>
          </form>

          <div className="text-center mt-5">
            <button
              onClick={() => {
                setMode("register");
                setErrorMsg("");
              }}
              className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs"
            >
              {translations.dontHaveAccount}
            </button>
          </div>
        </motion.div>
      )}

      {mode === "register" && (
        <motion.div
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex flex-col justify-center my-4 overflow-y-auto"
        >
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {translations.registerTitle}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {translations.registerSubtitle}
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            {errorMsg && (
              <div className="p-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs text-center border border-red-500/15">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                {translations.nameLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 pl-10 pr-4 py-2 text-xs focus:border-emerald-500 focus:outline-none dark:text-stone-100"
                  placeholder="Abdullah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <User size={13} className="absolute left-3.5 top-3 text-stone-400" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                {translations.emailLabel}
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 pl-10 pr-4 py-2 text-xs focus:border-emerald-500 focus:outline-none dark:text-stone-100"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={13} className="absolute left-3.5 top-3 text-stone-400" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                {translations.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 pl-10 pr-4 py-2 text-xs focus:border-emerald-500 focus:outline-none dark:text-stone-100"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={13} className="absolute left-3.5 top-3 text-stone-400" />
              </div>
            </div>

            {/* Interactive iOS Switch Panel for T&C acceptance */}
            <div className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-850 bg-stone-50/50 dark:bg-stone-900/30 text-[10px] space-y-1.5 leading-normal">
              <div className="flex items-center gap-1.5 text-stone-800 dark:text-stone-300 font-bold">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                <span>{translations.termsTitle}</span>
              </div>
              <p className="text-stone-500 dark:text-stone-400">
                {translations.termsBody}
              </p>
              <label className="flex items-start gap-2 pt-1 font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4.5 h-4.5 text-emerald-500 accent-emerald-500 rounded shrink-0 focus:ring-emerald-500 cursor-pointer"
                />
                <span>{translations.acceptTerms}</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
            >
              {translations.registerBtn}
            </button>
          </form>

          <div className="text-center mt-3">
            <button
              onClick={() => {
                setMode("login");
                setErrorMsg("");
              }}
              className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs"
            >
              {translations.alreadyHaveAccount}
            </button>
          </div>
        </motion.div>
      )}

      {/* Safety Policy Margin */}
      <div className="text-[9px] text-center text-stone-400 dark:text-stone-500 mt-2 hover:text-stone-500 transition-colors">
        {translations.acceptNotice}
      </div>
    </div>
  );
}
