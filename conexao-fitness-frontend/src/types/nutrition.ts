export interface MealItem {
  id: string;
  name: string;
  portion: string;
  portionGrams?: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  calories: number;
  substitutions?: string[];
  notes?: string;
}

export interface Meal {
  id: string;
  order: number;
  time: string;
  name: string;
  description?: string;
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export interface NutritionalMacros {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  waterMl: number;
}

export interface SupplementRecommendation {
  name: string;
  dosage: string;
  timing: string;
  purpose: string;
}

export interface DietPlan {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  nutritionistId?: string;
  nutritionistName?: string;
  nutritionistAvatar?: string;
  nutritionistCrn?: string;
  title: string;
  goal: "EMAGRECIMENTO" | "HIPERTROFIA" | "MANUTENCAO" | "PERFORMANCE" | "SAUDE";
  goalTitle: string;
  dailyCaloriesTarget: number;
  proteinGramsTarget: number;
  carbsGramsTarget: number;
  fatsGramsTarget: number;
  waterMlTarget: number;
  meals: Meal[];
  supplements: SupplementRecommendation[];
  generalGuidelines: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface DietQuestionnaireData {
  studentId: string;
  studentName: string;
  gender: "MASCULINO" | "FEMININO";
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: "SEDENTARIO" | "LEVE" | "MODERADO" | "INTENSO" | "MUITO_INTENSO";
  goal: "EMAGRECIMENTO" | "HIPERTROFIA" | "MANUTENCAO" | "PERFORMANCE";
  dietaryPreference: "ONIVORO" | "VEGETARIANO" | "VEGANO" | "LOW_CARB" | "SEM_LACTOSE" | "SEM_GLUTEN";
  mealsCount: 3 | 4 | 5 | 6;
  wakeUpTime?: string;
  workoutTime?: string;
  sleepTime?: string;
  selectedSupplements: string[];
  foodDislikes?: string;
  specialNotes?: string;
}

export interface WorkoutQuestionnaireData {
  studentId: string;
  studentName: string;
  goal: "HIPERTROFIA" | "EMAGRECIMENTO" | "FORCA" | "RESISTENCIA" | "CONDICIONAMENTO";
  level: "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";
  weeklyFrequency: 2 | 3 | 4 | 5 | 6;
  sessionDurationMinutes: 30 | 45 | 60 | 90;
  splitPreference: "AUTO" | "FULL_BODY" | "AB" | "ABC" | "ABCD" | "ABCDE" | "PUSH_PULL_LEGS" | "UPPER_LOWER";
  priorityMuscleFocus: "EQUILIBRADO" | "PEITORAL_BRACOS" | "PERNAS_GLUTEOS" | "COSTAS_OMBROS" | "CORE_ABDOMEN";
  jointRestrictions: "NENHUMA" | "LOMBAR_COLUNA" | "JOELHO" | "OMBRO" | "PUNHO";
  trainingEnvironment: "ACADEMIA_COMPLETA" | "HALTERES_BARRAS" | "PESO_CORPORAL";
  advancedMethods: string[];
  specialNotes?: string;
}
