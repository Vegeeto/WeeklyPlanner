export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any;
}

export interface MealPlan {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  breakfast: string;
  breakfastRecipeId?: string;
  morningNotes?: string;
  lunch: string;
  lunchRecipeId?: string;
  afternoonNotes?: string;
  dinner: string;
  dinnerRecipeId?: string;
  eveningNotes?: string;
  notes: string; // General daily notes
}

export interface Recipe {
  id?: string;
  userId: string;
  name: string;
  ingredients: string;
  instructions: string;
  createdAt: any;
}

export interface ShoppingItem {
  id?: string;
  userId: string;
  name: string;
  completed: boolean;
  createdAt: any;
}
