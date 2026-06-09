export interface UserProfile {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  dailyCalorieTarget: number;
  exercise: string; // e.g. 'none', 'light', 'moderate', 'heavy'
  goesToGym: boolean;
  followsDiet: boolean;
  favoriteFoods: string;
}

export interface SuggestedRecipe {
  recipeName: string;
  source: string;
  calories: number;
  benefits: string;
  ingredients: string[];
  instructions: string;
}

export interface FoodAnalysis {
  foodName: string;
  confidence: "High" | "Medium" | "Low" | string;
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  nutritionalSummary: string;
  nutritionalHighlights: string[];
  healthScore: number;
  suggestedRecipes: SuggestedRecipe[];
}

export interface HistoryItem {
  id: string;
  dateTime: string;
  imageBase64: string;
  foodAnalysis: FoodAnalysis;
}

export type Language = "en" | "ar";
export type Theme = "light" | "dark";

export interface AppTranslations {
  welcomeTitle: string;
  welcomeSubtitle: string;
  getStarted: string;
  loginTitle: string;
  loginSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  emailLabel: string;
  passwordLabel: string;
  nameLabel: string;
  loginBtn: string;
  registerBtn: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  guestUser: string;
  termsTitle: string;
  termsBody: string;
  acceptTerms: string;
  next: string;
  back: string;
  
  // Questionnaire
  questionsTitle: string;
  questionsSubtitle: string;
  ageLabel: string;
  genderLabel: string;
  maleOpt: string;
  femaleOpt: string;
  otherOpt: string;
  calorieTargetLabel: string;
  exerciseLabel: string;
  exNone: string;
  exLight: string;
  exMod: string;
  exHeavy: string;
  gymLabel: string;
  dietLabel: string;
  favFoodsLabel: string;
  submitProfile: string;

  // Main UI
  navHome: string;
  navHistory: string;
  navProfile: string;
  hiGreeting: string;
  trackerTitle: string;
  trackerSubtitle: string;
  dailyGoal: string;
  eaten: string;
  remaining: string;
  uploadTitle: string;
  uploadDesc: string;
  uploadBtn: string;
  analyzeBtn: string;
  analyzingLoader: string;
  acceptNotice: string;
  warningSensitive: string;

  // Results
  resultTitle: string;
  healthScore: string;
  confidenceLabel: string;
  carbsLabel: string;
  proteinLabel: string;
  fatLabel: string;
  fiberLabel: string;
  sugarLabel: string;
  sodiumLabel: string;
  insightsTitle: string;
  recipeTitle: string;
  recipeSource: string;
  ingredientsTitle: string;
  instructionsTitle: string;
  closeBtn: string;
  
  // Profile Screen
  profileTitle: string;
  languageSelect: string;
  themeToggle: string;
  logoutBtn: string;
  saveBtn: string;
  profileSaved: string;

  // History List
  historyTitle: string;
  emptyHistory: string;
  caloriesKcal: string;
  loggedAt: string;
}
