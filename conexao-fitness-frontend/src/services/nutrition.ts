import { apiRequest } from "@/lib/apiClient";
import type {
  DietPlan,
  DietQuestionnaireData,
  WorkoutQuestionnaireData,
  Meal,
  MealItem,
  SupplementRecommendation,
} from "@/types/nutrition";
import type { WorkoutRoutine, WorkoutExercise } from "@/types/workouts";

const LOCAL_DIET_PLAN_KEY = "cf_student_diet_plans_v2";

/**
 * Busca o plano alimentar ativo do aluno
 */
export async function fetchMyDietPlan(studentId?: string): Promise<DietPlan | null> {
  try {
    const query = studentId ? `?studentId=${studentId}` : "";
    const res = await apiRequest<DietPlan>(`/nutrition/diet-plan${query}`);
    if (res && res.id) {
      localStorage.setItem(`${LOCAL_DIET_PLAN_KEY}_${studentId || "me"}`, JSON.stringify(res));
      return res;
    }
  } catch (err) {
    console.warn("Backend nutrition unavailable, checking local store:", err);
  }

  const raw = localStorage.getItem(`${LOCAL_DIET_PLAN_KEY}_${studentId || "me"}`);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }

  // Plano alimentar padrão inicial de exemplo de alta qualidade
  const defaultDiet: DietPlan = {
    id: "diet-finex-default-camila",
    studentId: studentId || "current-user",
    studentName: "Aluno Finex",
    nutritionistId: "nutri-camila-santos",
    nutritionistName: "Dra. Camila Santos (CRN-2 14892)",
    nutritionistAvatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150",
    nutritionistCrn: "CRN-2 14892",
    title: "Plano Alimentar — Hipertrofia Limpa & Definição Metabólica",
    goal: "HIPERTROFIA",
    goalTitle: "Hipertrofia com Controle de Gordura Corporal",
    dailyCaloriesTarget: 2450,
    proteinGramsTarget: 165,
    carbsGramsTarget: 280,
    fatsGramsTarget: 65,
    waterMlTarget: 3200,
    meals: [
      {
        id: "meal-1",
        order: 1,
        time: "07:30",
        name: "Café da Manhã Energético",
        description: "Desjejum rico em proteínas e carboidratos complexos de lenta absorção.",
        totalCalories: 480,
        totalProtein: 32,
        totalCarbs: 55,
        totalFats: 14,
        items: [
          {
            id: "m1-1",
            name: "Ovos Mexidos com Cúrcuma",
            portion: "3 unidades inteiras",
            portionGrams: 150,
            proteinGrams: 18,
            carbsGrams: 2,
            fatsGrams: 14,
            calories: 210,
            substitutions: ["120g de Tofu grelhado", "1 scoop de Whey Protein em água + 1 colher de pasta de amendoim"],
          },
          {
            id: "m1-2",
            name: "Pão 100% Integral ou Tapioca com Chia",
            portion: "2 fatias (50g) ou 60g de massa",
            portionGrams: 50,
            proteinGrams: 6,
            carbsGrams: 28,
            fatsGrams: 1,
            calories: 140,
          },
          {
            id: "m1-3",
            name: "Frutas Frescas (Mamão Papaya ou Morangos)",
            portion: "1 fatia média (120g)",
            portionGrams: 120,
            proteinGrams: 1,
            carbsGrams: 18,
            fatsGrams: 0,
            calories: 60,
          },
          {
            id: "m1-4",
            name: "Café Preto sem Açúcar ou Chá Verde",
            portion: "1 xícara (150ml)",
            proteinGrams: 0,
            carbsGrams: 0,
            fatsGrams: 0,
            calories: 2,
          },
        ],
      },
      {
        id: "meal-2",
        order: 2,
        time: "12:30",
        name: "Almoço Anabólico & Equilibrado",
        description: "Refeição densa em micronutrientes, ferro, zinco e fibras.",
        totalCalories: 680,
        totalProtein: 48,
        totalCarbs: 78,
        totalFats: 16,
        items: [
          {
            id: "m2-1",
            name: "Peito de Frango Grelhado em Tiras",
            portion: "160g pesado pronto",
            portionGrams: 160,
            proteinGrams: 42,
            carbsGrams: 0,
            fatsGrams: 5,
            calories: 240,
            substitutions: ["170g de Patinho moído", "180g de Tilápia / Salmão grelhado", "180g de Cogumelos + Ervilha"],
          },
          {
            id: "m2-2",
            name: "Arroz Branco ou Integral Cozido",
            portion: "5 colheres de sopa cheias (150g)",
            portionGrams: 150,
            proteinGrams: 4,
            carbsGrams: 42,
            fatsGrams: 1,
            calories: 190,
          },
          {
            id: "m2-3",
            name: "Feijão Carioca ou Preto Cozido (Caldo e Grão)",
            portion: "1 concha média (100g)",
            portionGrams: 100,
            proteinGrams: 5,
            carbsGrams: 18,
            fatsGrams: 1,
            calories: 90,
          },
          {
            id: "m2-4",
            name: "Salada Colorida à Vontade (Rúcula, Tomate, Cenoura) com Azeite de Oliva EV",
            portion: "1 prato de sobremesa + 1 fio de azeite (8ml)",
            portionGrams: 100,
            proteinGrams: 1,
            carbsGrams: 8,
            fatsGrams: 8,
            calories: 110,
          },
        ],
      },
      {
        id: "meal-3",
        order: 3,
        time: "16:30",
        name: "Lanche Pré-Treino de Alta Performance",
        description: "Glicogênio rápido e digestão leve 60-90min antes da sessão.",
        totalCalories: 450,
        totalProtein: 34,
        totalCarbs: 62,
        totalFats: 8,
        items: [
          {
            id: "m3-1",
            name: "Shake de Whey Protein Concentrado Finex",
            portion: "1 scoop (30g) batido com água ou leite desnatado",
            portionGrams: 30,
            proteinGrams: 24,
            carbsGrams: 3,
            fatsGrams: 2,
            calories: 130,
          },
          {
            id: "m3-2",
            name: "Banana Prata com Aveia em Flocos e Canela",
            portion: "1 unidade grande (100g) + 3 colheres de sopa de aveia (40g)",
            portionGrams: 140,
            proteinGrams: 7,
            carbsGrams: 45,
            fatsGrams: 3,
            calories: 230,
          },
          {
            id: "m3-3",
            name: "Pasta de Amendoim Integral",
            portion: "1 colher de chá rasa (15g)",
            portionGrams: 15,
            proteinGrams: 4,
            carbsGrams: 3,
            fatsGrams: 7,
            calories: 90,
          },
        ],
      },
      {
        id: "meal-4",
        order: 4,
        time: "20:30",
        name: "Jantar Regenerativo Pós-Treino",
        description: "Síntese proteica noturna e reposição de eletrólitos.",
        totalCalories: 620,
        totalProtein: 44,
        totalCarbs: 65,
        totalFats: 16,
        items: [
          {
            id: "m4-1",
            name: "Filé de Tilápia ou Salmão ao Forno com Ervas",
            portion: "180g pronto",
            portionGrams: 180,
            proteinGrams: 38,
            carbsGrams: 0,
            fatsGrams: 8,
            calories: 230,
          },
          {
            id: "m4-2",
            name: "Batata Doce ou Mandioca Assada em Cubos",
            portion: "150g",
            portionGrams: 150,
            proteinGrams: 2,
            carbsGrams: 42,
            fatsGrams: 0,
            calories: 170,
          },
          {
            id: "m4-3",
            name: "Legumes Cozidos no Vapor (Brócolis, Abobrinha, Couve-Flor)",
            portion: "150g à vontade",
            portionGrams: 150,
            proteinGrams: 4,
            carbsGrams: 12,
            fatsGrams: 1,
            calories: 70,
          },
          {
            id: "m4-4",
            name: "Azeite de Oliva Extra Virgem",
            portion: "1 colher de sobremesa (8ml)",
            portionGrams: 8,
            proteinGrams: 0,
            carbsGrams: 0,
            fatsGrams: 8,
            calories: 72,
          },
        ],
      },
      {
        id: "meal-5",
        order: 5,
        time: "22:45",
        name: "Ceia Noturna & Reparação Celular",
        description: "Digestão lenta para manutenção de aminoácidos durante o sono.",
        totalCalories: 220,
        totalProtein: 18,
        totalCarbs: 12,
        totalFats: 10,
        items: [
          {
            id: "m5-1",
            name: "Iogurte Natural Desnatado ou Proteico",
            portion: "1 pote (160g)",
            portionGrams: 160,
            proteinGrams: 14,
            carbsGrams: 8,
            fatsGrams: 2,
            calories: 105,
          },
          {
            id: "m5-2",
            name: "Castanhas do Pará ou Nozes",
            portion: "3 unidades médias (15g)",
            portionGrams: 15,
            proteinGrams: 3,
            carbsGrams: 2,
            fatsGrams: 9,
            calories: 100,
          },
        ],
      },
    ],
    supplements: [
      {
        name: "Creatina Monohidratada 100% Pura",
        dosage: "5g ao dia (todos os dias, inclusive sem treino)",
        timing: "Pós-treino ou junto com a maior refeição de carboidrato",
        purpose: "Aumento de força máxima, volume celular e ressíntese rápida de ATP.",
      },
      {
        name: "Whey Protein Concentrado 80%",
        dosage: "1 scoop (30g) ao dia",
        timing: "Lanche da tarde ou pós-treino imediato",
        purpose: "Facilidade de ingestão proteica com alto valor biológico e BCAA.",
      },
      {
        name: "Ômega 3 (EPA/DHA concentrado)",
        dosage: "2 cápsulas (2g de óleo)",
        timing: "Junto com o almoço ou jantar",
        purpose: "Ação anti-inflamatória muscular, saúde articular e cardiovascular.",
      },
      {
        name: "Magnésio Bisglicinato & Zinco (ZMA)",
        dosage: "1 cápsula",
        timing: "30 minutos antes de dormir",
        purpose: "Melhora da qualidade do sono REM e recuperação neuromuscular.",
      },
    ],
    generalGuidelines: [
      "Mantenha a meta de hidratação de 3,2 Litros de água ao longo do dia, distribuídos a cada 2 horas.",
      "Evite líquidos açucarados e refrigerantes convencionais. Sucos naturais de fruta contam calorias de carboidrato.",
      "Priorize mastigar devagar: 20 minutos por refeição melhora a absorção e saciedade.",
      "Em dias sem treino, mantenha as mesmas calorias e macros para recuperação e síntese proteica contínua.",
      "Qualquer dúvida sobre substituições, utilize o Chat do App Finex com sua Nutricionista.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  localStorage.setItem(`${LOCAL_DIET_PLAN_KEY}_${studentId || "me"}`, JSON.stringify(defaultDiet));
  return defaultDiet;
}

/**
 * Salva ou publica um plano alimentar
 */
export async function saveDietPlan(plan: DietPlan): Promise<DietPlan> {
  try {
    const res = await apiRequest<DietPlan>("/nutrition/diet-plan", {
      method: "POST",
      body: plan,
    });
    if (res && res.id) {
      localStorage.setItem(`${LOCAL_DIET_PLAN_KEY}_${plan.studentId}`, JSON.stringify(res));
      return res;
    }
  } catch (err) {
    console.warn("Backend save diet offline, persisting locally:", err);
  }

  localStorage.setItem(`${LOCAL_DIET_PLAN_KEY}_${plan.studentId}`, JSON.stringify(plan));
  return plan;
}

/**
 * Algoritmo Inteligente de Criação de Plano Alimentar a partir do Questionário
 */
export function generateDietFromQuestionnaire(
  data: DietQuestionnaireData,
  nutritionistUser?: any
): DietPlan {
  // 1. Cálculo da Taxa Metabólica Basal (Fórmula de Mifflin-St Jeor)
  let bmr = 10 * data.weightKg + 6.25 * data.heightCm - 5 * data.age;
  bmr = data.gender === "MASCULINO" ? bmr + 5 : bmr - 161;

  // 2. Fator de Atividade
  const activityFactors = {
    SEDENTARIO: 1.2,
    LEVE: 1.375,
    MODERADO: 1.55,
    INTENSO: 1.725,
    MUITO_INTENSO: 1.9,
  };
  const tdee = Math.round(bmr * (activityFactors[data.activityLevel] || 1.55));

  // 3. Ajuste de Calorias por Objetivo
  let targetCalories = tdee;
  let goalTitle = "Manutenção e Saúde Metabólica";

  if (data.goal === "EMAGRECIMENTO") {
    targetCalories = Math.max(1300, Math.round(tdee - 450));
    goalTitle = "Déficit Calórico Controlado (Emagrecimento & Definição)";
  } else if (data.goal === "HIPERTROFIA") {
    targetCalories = Math.round(tdee + 350);
    goalTitle = "Superávit Calórico Limpo (Ganho de Massa Muscular)";
  } else if (data.goal === "PERFORMANCE") {
    targetCalories = Math.round(tdee + 200);
    goalTitle = "Alta Performance Esportiva & Resistência";
  }

  // 4. Distribuição de Macronutrientes
  // Proteína: 2.0g a 2.2g por kg
  const proteinGrams = Math.round(data.weightKg * (data.goal === "EMAGRECIMENTO" ? 2.2 : 2.0));
  // Gordura: 0.8g a 0.9g por kg
  const fatsGrams = Math.round(data.weightKg * 0.85);
  // Carboidratos: restante das calorias
  const caloriesFromProteinAndFat = proteinGrams * 4 + fatsGrams * 9;
  const remainingCalories = Math.max(200, targetCalories - caloriesFromProteinAndFat);
  const carbsGrams = Math.round(remainingCalories / 4);

  // 5. Meta de Água diária (38ml a 42ml por kg)
  const waterMlTarget = Math.round(data.weightKg * 40);

  // 6. Montagem das Refeições
  const mealsCount = data.mealsCount || 4;
  const meals: Meal[] = [];

  const mealTemplates = getMealTemplatesForCount(
    mealsCount,
    data.dietaryPreference,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatsGrams
  );

  mealTemplates.forEach((template, idx) => {
    meals.push({
      id: `meal-gen-${idx + 1}`,
      order: idx + 1,
      time: template.time,
      name: template.name,
      description: template.description,
      items: template.items,
      totalCalories: template.items.reduce((sum, item) => sum + item.calories, 0),
      totalProtein: template.items.reduce((sum, item) => sum + item.proteinGrams, 0),
      totalCarbs: template.items.reduce((sum, item) => sum + item.carbsGrams, 0),
      totalFats: template.items.reduce((sum, item) => sum + item.fatsGrams, 0),
    });
  });

  // 7. Suplementação
  const supplements: SupplementRecommendation[] = [];
  if (data.selectedSupplements.includes("CREATINA")) {
    supplements.push({
      name: "Creatina Monohidratada 100% Pura",
      dosage: "5g diárias",
      timing: "Pós-treino ou com a principal refeição rica em carboidratos",
      purpose: "Ressíntese de ATP celular, explosão muscular e hidratação intracelular.",
    });
  }
  if (data.selectedSupplements.includes("WHEY_PROTEIN")) {
    supplements.push({
      name: "Whey Protein Concentrado ou Isolado",
      dosage: "1 scoop (30g)",
      timing: "Lanche da tarde ou pós-treino",
      purpose: "Aporte rápido de aminoácidos essenciais e suporte à síntese proteica.",
    });
  }
  if (data.selectedSupplements.includes("OMEGA_3")) {
    supplements.push({
      name: "Ômega 3 Concentrado (EPA / DHA)",
      dosage: "2 cápsulas (2g de óleo)",
      timing: "Junto com o almoço ou jantar",
      purpose: "Ação anti-inflamatória, suporte cardiovascular e saúde articular.",
    });
  }
  if (data.selectedSupplements.includes("MULTIVITAMINICO")) {
    supplements.push({
      name: "Complexo Multivitamínico & Mineral",
      dosage: "1 cápsula",
      timing: "Pela manhã junto ao café da manhã",
      purpose: "Equilíbrio de micronutrientes e suporte imunológico.",
    });
  }
  if (data.selectedSupplements.includes("CAFEINA")) {
    supplements.push({
      name: "Cafeína Anidra / Termogênico",
      dosage: "150mg a 200mg",
      timing: "30 minutos antes do treino (evitar após as 17h)",
      purpose: "Aumento de foco, estado de alerta e redução da percepção de esforço.",
    });
  }

  const dietPlan: DietPlan = {
    id: `diet-plan-${Date.now()}`,
    studentId: data.studentId,
    studentName: data.studentName,
    nutritionistId: nutritionistUser?.id || "nutritionist-pro",
    nutritionistName: nutritionistUser?.name || "Nutricionista Finex Pro",
    nutritionistAvatar: nutritionistUser?.avatarUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150",
    nutritionistCrn: nutritionistUser?.crn || "CRN Regularizado",
    title: `Plano Alimentar Inteligente — ${data.studentName}`,
    goal: data.goal,
    goalTitle,
    dailyCaloriesTarget: targetCalories,
    proteinGramsTarget: proteinGrams,
    carbsGramsTarget: carbsGrams,
    fatsGramsTarget: fatsGrams,
    waterMlTarget,
    meals,
    supplements,
    generalGuidelines: [
      `Meta hídrica de ${((waterMlTarget || 3000) / 1000).toFixed(1)} Litros de água por dia. Beba um copo de 300ml a cada 1h30.`,
      "Mantenha a regularidade dos horários das refeições para estabilidade da insulina e saciedade.",
      "As pesagens dos alimentos devem ser feitas com o alimento já preparado/cozido, exceto se indicado o contrário.",
      "Tempere os alimentos com ervas naturais (alecrim, orégano, cúrcuma, alho e cebola). Evite molhos industrializados calóricos.",
      "Registre sua evolução e tire dúvidas diretamente com sua Nutricionista pelo Chat Finex.",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  return dietPlan;
}

/**
 * Algoritmo Inteligente de Criação de Fichas de Treino por Questionário
 */
export function generateWorkoutFromQuestionnaire(
  data: WorkoutQuestionnaireData,
  personalUser?: any
): WorkoutRoutine[] {
  const routines: WorkoutRoutine[] = [];
  const freq = data.weeklyFrequency;
  const isAdv = data.level === "AVANCADO";
  const isInter = data.level === "INTERMEDIARIO";
  const isLombar = data.jointRestrictions === "LOMBAR_COLUNA";
  const isJoelho = data.jointRestrictions === "JOELHO";
  const isOmbro = data.jointRestrictions === "OMBRO";

  // Determina divisões de treino ideais
  if (freq === 2) {
    // Divisão AB (Superior / Inferior)
    routines.push(
      createRoutineObject(
        "Treino A — Membros Superiores & Core",
        "Segunda-feira",
        ["Peitoral", "Costas", "Ombros", "Braços", "Abdômen"],
        [
          { order: 1, name: isOmbro ? "Supino Reto com Halteres (Pegada Neutra)" : "Supino Reto com Barra", muscleGroup: "Peitoral", sets: 4, reps: "8-10", targetWeightKg: 40, restSeconds: 75, notes: "Cadência 3-0-1. Escápulas travadas." },
          { order: 2, name: isLombar ? "Puxada Frontal Aberta na Polia" : "Remada Curvada com Barra", muscleGroup: "Costas", sets: 4, reps: "10-12", targetWeightKg: 45, restSeconds: 60, notes: "Foco na contração dorsal." },
          { order: 3, name: "Desenvolvimento com Halteres Sentado", muscleGroup: "Ombros", sets: 3, reps: "10-12", targetWeightKg: 14, restSeconds: 60, notes: "Não hiperestender a lombar." },
          { order: 4, name: "Rosca Direta com Barra W", muscleGroup: "Bíceps", sets: 3, reps: "10-12", targetWeightKg: 18, restSeconds: 45 },
          { order: 5, name: "Tríceps Corda na Polia Alta", muscleGroup: "Tríceps", sets: 3, reps: "12-15", targetWeightKg: 20, restSeconds: 45 },
          { order: 6, name: "Prancha Abdominal Isométrica", muscleGroup: "Abdômen", sets: 3, reps: "45 seg", targetWeightKg: 0, restSeconds: 45 },
        ],
        data,
        personalUser
      ),
      createRoutineObject(
        "Treino B — Membros Inferiores & Glúteos",
        "Quinta-feira",
        ["Quadríceps", "Posteriores", "Glúteos", "Panturrilhas"],
        [
          { order: 1, name: isJoelho ? "Leg Press 45º (Pés Altos)" : isLombar ? "Agachamento Hack" : "Agachamento Livre com Barra", muscleGroup: "Quadríceps", sets: 4, reps: "8-10", targetWeightKg: 50, restSeconds: 90, notes: "Amplitude segura e controlada." },
          { order: 2, name: "Cadeira Extensora", muscleGroup: "Quadríceps", sets: 3, reps: "12-15", targetWeightKg: 35, restSeconds: 60, notes: "Pausa isométrica de 1s no topo." },
          { order: 3, name: isLombar ? "Mesa Flexora Deitada" : "Stiff com Halteres", muscleGroup: "Posteriores", sets: 4, reps: "10-12", targetWeightKg: 20, restSeconds: 60 },
          { order: 4, name: "Elevação Pélvica com Barra / Máquina", muscleGroup: "Glúteos", sets: 4, reps: "10-12", targetWeightKg: 40, restSeconds: 60, notes: "Pico de contração no topo de 2s." },
          { order: 5, name: "Panturrilha no Smith / Sentado", muscleGroup: "Panturrilhas", sets: 4, reps: "15-20", targetWeightKg: 30, restSeconds: 45 },
        ],
        data,
        personalUser
      )
    );
  } else if (freq === 3 || freq === 4) {
    // Divisão ABC ou ABCD
    routines.push(
      createRoutineObject(
        "Treino A — Peitoral, Deltóide Anterior & Tríceps (Push)",
        "Segunda / Quinta",
        ["Peitoral", "Ombros", "Tríceps"],
        [
          { order: 1, name: isOmbro ? "Supino Inclinado com Halteres" : "Supino Reto com Barra", muscleGroup: "Peitoral", sets: isAdv ? 5 : 4, reps: "8-10", targetWeightKg: 50, restSeconds: 90, notes: "Sobrecarga progressiva." },
          { order: 2, name: "Supino Inclinado com Halteres (30º)", muscleGroup: "Peitoral", sets: 4, reps: "10-12", targetWeightKg: 22, restSeconds: 60 },
          { order: 3, name: "Crucifixo no Crossover / Voador", muscleGroup: "Peitoral", sets: 3, reps: "12-15", targetWeightKg: 15, restSeconds: 45, notes: isAdv ? "Drop-set na última série." : undefined },
          { order: 4, name: "Elevação Lateral com Halteres", muscleGroup: "Ombros", sets: 4, reps: "12-15", targetWeightKg: 10, restSeconds: 45, notes: "Tronco firme, cotovelos alinhados." },
          { order: 5, name: "Tríceps Corda na Polia", muscleGroup: "Tríceps", sets: 4, reps: "12-15", targetWeightKg: 25, restSeconds: 45 },
          { order: 6, name: "Tríceps Francês / Testa no Banco", muscleGroup: "Tríceps", sets: 3, reps: "10-12", targetWeightKg: 14, restSeconds: 45 },
        ],
        data,
        personalUser
      ),
      createRoutineObject(
        "Treino B — Dorsal, Deltóide Posterior & Bíceps (Pull)",
        "Terça / Sexta",
        ["Costas", "Ombros", "Bíceps", "Abdômen"],
        [
          { order: 1, name: "Puxada Alta Frontal na Polia", muscleGroup: "Costas", sets: 4, reps: "8-10", targetWeightKg: 55, restSeconds: 75, notes: "Puxar em direção ao peitoral superior." },
          { order: 2, name: isLombar ? "Remada Baixa na Polia com Triângulo" : "Remada Curvada com Barra", muscleGroup: "Costas", sets: 4, reps: "10-12", targetWeightKg: 45, restSeconds: 60 },
          { order: 3, name: "Crucifixo Invertido no Crossover", muscleGroup: "Ombros", sets: 4, reps: "12-15", targetWeightKg: 10, restSeconds: 45 },
          { order: 4, name: "Rosca Direta com Barra W", muscleGroup: "Bíceps", sets: 4, reps: "10-12", targetWeightKg: 20, restSeconds: 45 },
          { order: 5, name: "Rosca Martelo com Halteres", muscleGroup: "Bíceps / Braquial", sets: 3, reps: "10-12", targetWeightKg: 12, restSeconds: 45 },
          { order: 6, name: "Abdominal Supra na Polia ou Solo", muscleGroup: "Abdômen", sets: 4, reps: "15-20", targetWeightKg: 20, restSeconds: 45 },
        ],
        data,
        personalUser
      ),
      createRoutineObject(
        "Treino C — Membros Inferiores Completos (Legs)",
        "Quarta / Sábado",
        ["Quadríceps", "Posteriores", "Glúteos", "Panturrilhas"],
        [
          { order: 1, name: isJoelho ? "Leg Press 45º" : isLombar ? "Agachamento Hack" : "Agachamento Livre com Barra", muscleGroup: "Quadríceps", sets: 4, reps: "8-10", targetWeightKg: 60, restSeconds: 90, notes: "Aquecer 1 série antes da carga alvo." },
          { order: 2, name: "Cadeira Extensora", muscleGroup: "Quadríceps", sets: 4, reps: "12-15", targetWeightKg: 40, restSeconds: 60, notes: "Isometria de 1s na contração máxima." },
          { order: 3, name: "Mesa Flexora Deitada", muscleGroup: "Posteriores", sets: 4, reps: "10-12", targetWeightKg: 35, restSeconds: 60 },
          { order: 4, name: isLombar ? "Cadeira Flexora" : "Stiff com Halteres", muscleGroup: "Posteriores", sets: 3, reps: "10-12", targetWeightKg: 24, restSeconds: 60 },
          { order: 5, name: "Elevação Pélvica com Barra", muscleGroup: "Glúteos", sets: 4, reps: "10-12", targetWeightKg: 50, restSeconds: 60 },
          { order: 6, name: "Panturrilha em Pé na Máquina", muscleGroup: "Panturrilhas", sets: 4, reps: "15-20", targetWeightKg: 40, restSeconds: 45 },
        ],
        data,
        personalUser
      )
    );
  } else {
    // Divisão 5x ou 6x (ABCDE de Alta Intensidade)
    routines.push(
      createRoutineObject("Treino A — Peitoral & Abdômen", "Segunda", ["Peitoral", "Abdômen"], [
        { order: 1, name: "Supino Reto com Barra", muscleGroup: "Peitoral", sets: 4, reps: "8-10", targetWeightKg: 60, restSeconds: 90 },
        { order: 2, name: "Supino Inclinado com Halteres", muscleGroup: "Peitoral", sets: 4, reps: "10-12", targetWeightKg: 24, restSeconds: 60 },
        { order: 3, name: "Crucifixo no Crossover", muscleGroup: "Peitoral", sets: 4, reps: "12-15", targetWeightKg: 15, restSeconds: 45 },
        { order: 4, name: "Crossover Polia Baixa", muscleGroup: "Peitoral Superior", sets: 3, reps: "12-15", targetWeightKg: 10, restSeconds: 45 },
        { order: 5, name: "Abdominal Infra na Barra Fixa", muscleGroup: "Abdômen", sets: 4, reps: "12-15", targetWeightKg: 0, restSeconds: 45 },
      ], data, personalUser),
      createRoutineObject("Treino B — Dorsais & Lombar", "Terça", ["Costas", "Lombar"], [
        { order: 1, name: "Puxada Alta Frontal Aberta", muscleGroup: "Costas", sets: 4, reps: "8-10", targetWeightKg: 60, restSeconds: 75 },
        { order: 2, name: "Remada Curvada com Barra Pegada Pronada", muscleGroup: "Costas", sets: 4, reps: "8-10", targetWeightKg: 50, restSeconds: 75 },
        { order: 3, name: "Remada Cavalinho / Máquina", muscleGroup: "Costas", sets: 3, reps: "10-12", targetWeightKg: 45, restSeconds: 60 },
        { order: 4, name: "Pulldown na Polia com Corda", muscleGroup: "Dorsal", sets: 3, reps: "12-15", targetWeightKg: 25, restSeconds: 45 },
        { order: 5, name: "Hiperextensão Lombar no Banco", muscleGroup: "Lombar", sets: 3, reps: "15", targetWeightKg: 0, restSeconds: 45 },
      ], data, personalUser),
      createRoutineObject("Treino C — Quadríceps & Panturrilhas", "Quarta", ["Quadríceps", "Panturrilhas"], [
        { order: 1, name: "Agachamento Livre com Barra", muscleGroup: "Quadríceps", sets: 4, reps: "8-10", targetWeightKg: 60, restSeconds: 90 },
        { order: 2, name: "Leg Press 45º com Pés Fechados", muscleGroup: "Quadríceps", sets: 4, reps: "10-12", targetWeightKg: 140, restSeconds: 75 },
        { order: 3, name: "Agachamento Búlgaro com Halteres", muscleGroup: "Quadríceps / Glúteos", sets: 3, reps: "10 cada lado", targetWeightKg: 14, restSeconds: 60 },
        { order: 4, name: "Cadeira Extensora (Drop-set final)", muscleGroup: "Quadríceps", sets: 4, reps: "12-15", targetWeightKg: 45, restSeconds: 45 },
        { order: 5, name: "Gêmeos Sentado na Máquina", muscleGroup: "Panturrilhas", sets: 5, reps: "15-20", targetWeightKg: 35, restSeconds: 45 },
      ], data, personalUser),
      createRoutineObject("Treino D — Ombros & Trapézio", "Quinta", ["Ombros", "Trapézio"], [
        { order: 1, name: "Desenvolvimento Militar com Halteres", muscleGroup: "Ombros", sets: 4, reps: "8-10", targetWeightKg: 18, restSeconds: 75 },
        { order: 2, name: "Elevação Lateral na Polia Unilateral", muscleGroup: "Ombros", sets: 4, reps: "12-15", targetWeightKg: 8, restSeconds: 45 },
        { order: 3, name: "Elevação Frontal com Halteres", muscleGroup: "Ombros", sets: 3, reps: "12", targetWeightKg: 10, restSeconds: 45 },
        { order: 4, name: "Crucifixo Invertido no Banco Inclinado", muscleGroup: "Deltóide Posterior", sets: 4, reps: "12-15", targetWeightKg: 10, restSeconds: 45 },
        { order: 5, name: "Encolhimento de Ombros com Barra", muscleGroup: "Trapézio", sets: 4, reps: "12-15", targetWeightKg: 40, restSeconds: 45 },
      ], data, personalUser),
      createRoutineObject("Treino E — Braços Completos & Posteriores", "Sexta", ["Bíceps", "Tríceps", "Posteriores"], [
        { order: 1, name: "Mesa Flexora Deitada", muscleGroup: "Posteriores", sets: 4, reps: "10-12", targetWeightKg: 40, restSeconds: 60 },
        { order: 2, name: "Stiff com Barra", muscleGroup: "Posteriores / Glúteos", sets: 4, reps: "10-12", targetWeightKg: 30, restSeconds: 60 },
        { order: 3, name: "Rosca Direta com Barra W", muscleGroup: "Bíceps", sets: 4, reps: "10-12", targetWeightKg: 22, restSeconds: 45 },
        { order: 4, name: "Tríceps Testa com Barra W", muscleGroup: "Tríceps", sets: 4, reps: "10-12", targetWeightKg: 20, restSeconds: 45 },
        { order: 5, name: "Rosca Scott na Máquina / Banco", muscleGroup: "Bíceps", sets: 3, reps: "10-12", targetWeightKg: 20, restSeconds: 45 },
        { order: 6, name: "Tríceps Francês Unilateral na Polia", muscleGroup: "Tríceps", sets: 3, reps: "12-15", targetWeightKg: 12, restSeconds: 45 },
      ], data, personalUser)
    );
  }

  return routines;
}

function createRoutineObject(
  title: string,
  dayOfWeek: string,
  targetMuscleGroups: string[],
  exercises: WorkoutExercise[],
  data: WorkoutQuestionnaireData,
  personalUser?: any
): WorkoutRoutine {
  return {
    id: `routine-gen-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    studentId: data.studentId,
    creatorId: personalUser?.id || "personal-elite",
    creatorName: personalUser?.name || "Personal Trainer Finex Pro",
    creatorRole: "PERSONAL",
    creatorAvatar: personalUser?.avatarUrl || "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150",
    isPrescribedByPersonal: true,
    coachNotes: `Foco: ${data.goal}. Descanso estrito de acordo com a ficha. Mantenha o diário de cargas ativo pelo App Finex.`,
    title,
    description: `Ficha personalizada prescrita pelo seu Personal Trainer para objetivo de ${data.goal.toLowerCase()}.`,
    dayOfWeek,
    targetMuscleGroups,
    isActive: true,
    exercises,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getMealTemplatesForCount(
  count: number,
  pref: string,
  totalCalories: number,
  protein: number,
  carbs: number,
  fats: number
) {
  const isVeg = pref === "VEGETARIANO" || pref === "VEGANO";
  const isLowCarb = pref === "LOW_CARB";

  const protSourceLunch = isVeg ? "Tofu Orgânico Grelhado ou Grão de Bico" : "Peito de Frango Grelhado ou Patinho";
  const protSourceDinner = isVeg ? "Lentilhas Cozidas com Cogumelos Shimeji" : "Filé de Tilápia ou Salmão ao Forno";

  if (count === 3) {
    return [
      {
        time: "08:00",
        name: "Café da Manhã Completo",
        description: "Desjejum de alta energia e saciedade prolongada.",
        items: [
          { id: "i1", name: isVeg ? "Tofu Mexido com Cúrcuma" : "Ovos Mexidos Inteiros (3 unid)", portion: "3 ovos ou 150g tofu", proteinGrams: 18, carbsGrams: 2, fatsGrams: 14, calories: 210 },
          { id: "i2", name: isLowCarb ? "Abacate com Chia e Linhaça" : "Pão 100% Integral com Aveia", portion: isLowCarb ? "100g abacate" : "2 fatias (50g)", proteinGrams: 5, carbsGrams: isLowCarb ? 8 : 28, fatsGrams: isLowCarb ? 12 : 2, calories: 150 },
          { id: "i3", name: "Mamão com Canela ou Morangos", portion: "1 fatia (120g)", proteinGrams: 1, carbsGrams: 16, fatsGrams: 0, calories: 65 },
        ],
      },
      {
        time: "12:30",
        name: "Almoço Principal",
        description: "Aporte maciço de micronutrientes, ferro, zinco e fibras.",
        items: [
          { id: "i4", name: protSourceLunch, portion: "180g pronto", proteinGrams: 45, carbsGrams: 0, fatsGrams: 6, calories: 250 },
          { id: "i5", name: isLowCarb ? "Couve-Flor Gratinada" : "Arroz Integral com Feijão", portion: "150g arroz + 100g feijão", proteinGrams: 8, carbsGrams: isLowCarb ? 10 : 55, fatsGrams: 2, calories: isLowCarb ? 90 : 270 },
          { id: "i6", name: "Salada Verde Folhosa com Azeite de Oliva", portion: "1 prato + 10ml azeite", proteinGrams: 1, carbsGrams: 6, fatsGrams: 9, calories: 110 },
        ],
      },
      {
        time: "20:00",
        name: "Jantar Regenerativo",
        description: "Digestão leve e suporte anabólico noturno.",
        items: [
          { id: "i7", name: protSourceDinner, portion: "180g pronto", proteinGrams: 40, carbsGrams: 0, fatsGrams: 8, calories: 240 },
          { id: "i8", name: isLowCarb ? "Abobrinha e Brócolis Grelhados" : "Batata Doce Assada", portion: "160g", proteinGrams: 3, carbsGrams: isLowCarb ? 8 : 40, fatsGrams: 1, calories: isLowCarb ? 50 : 170 },
          { id: "i9", name: "Iogurte Proteico ou Castanhas", portion: "1 pote (150g)", proteinGrams: 14, carbsGrams: 10, fatsGrams: 4, calories: 130 },
        ],
      },
    ];
  }

  // Padrão 4 ou 5 refeições
  return [
    {
      time: "07:30",
      name: "Café da Manhã",
      description: "Combustível inicial rico em proteínas e carboidratos complexos.",
      items: [
        { id: "i1", name: isVeg ? "Tofu Mexido com Chia" : "Ovos Mexidos (3 unidades)", portion: "3 ovos", proteinGrams: 18, carbsGrams: 2, fatsGrams: 14, calories: 210 },
        { id: "i2", name: isLowCarb ? "Omelete com Queijo Branco" : "Pão Integral ou Tapioca", portion: "2 fatias (50g)", proteinGrams: 6, carbsGrams: isLowCarb ? 4 : 28, fatsGrams: 2, calories: 140 },
        { id: "i3", name: "Café Preto sem Açúcar", portion: "150ml", proteinGrams: 0, carbsGrams: 0, fatsGrams: 0, calories: 2 },
      ],
    },
    {
      time: "12:30",
      name: "Almoço",
      description: "Construção muscular e equilíbrio glicêmico.",
      items: [
        { id: "i4", name: protSourceLunch, portion: "160g", proteinGrams: 42, carbsGrams: 0, fatsGrams: 5, calories: 230 },
        { id: "i5", name: isLowCarb ? "Purê de Couve-Flor" : "Arroz Branco/Integral + Feijão", portion: "140g arroz + 80g feijão", proteinGrams: 6, carbsGrams: isLowCarb ? 8 : 48, fatsGrams: 1, calories: isLowCarb ? 60 : 230 },
        { id: "i6", name: "Salada Variada com Azeite de Oliva", portion: "1 prato + 8ml azeite", proteinGrams: 1, carbsGrams: 6, fatsGrams: 8, calories: 100 },
      ],
    },
    {
      time: "16:30",
      name: "Lanche da Tarde / Pré-Treino",
      description: "Glicogênio rápido e digestão leve.",
      items: [
        { id: "i7", name: "Shake de Whey Protein ou Proteína Vegetal", portion: "1 scoop (30g)", proteinGrams: 24, carbsGrams: 3, fatsGrams: 2, calories: 130 },
        { id: "i8", name: isLowCarb ? "Morangos com Castanhas" : "Banana com Aveia em Flocos", portion: "1 banana + 30g aveia", proteinGrams: 5, carbsGrams: isLowCarb ? 10 : 38, fatsGrams: isLowCarb ? 8 : 2, calories: isLowCarb ? 120 : 190 },
      ],
    },
    {
      time: "20:30",
      name: "Jantar",
      description: "Recuperação celular e descanso noturno.",
      items: [
        { id: "i9", name: protSourceDinner, portion: "170g", proteinGrams: 38, carbsGrams: 0, fatsGrams: 7, calories: 220 },
        { id: "i10", name: isLowCarb ? "Abóbora Cabotiá Assada" : "Batata Doce / Mandioca", portion: "140g", proteinGrams: 2, carbsGrams: isLowCarb ? 12 : 38, fatsGrams: 0, calories: isLowCarb ? 60 : 160 },
        { id: "i11", name: "Legumes no Vapor (Brócolis e Cenoura)", portion: "120g", proteinGrams: 3, carbsGrams: 8, fatsGrams: 0, calories: 45 },
      ],
    },
  ];
}
