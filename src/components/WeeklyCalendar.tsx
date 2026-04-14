import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { db, auth } from '@/src/lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { MealPlan, Recipe } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Loader2, ShoppingCart, Coffee, Sun, Moon, StickyNote, Calendar as CalendarIcon, Sparkles, Copy } from 'lucide-react';
import MealInput from './MealInput';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { writeBatch } from 'firebase/firestore';

export default function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mealPlans, setMealPlans] = useState<Record<string, MealPlan>>({});
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [generatingList, setGeneratingList] = useState(false);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [targetWeekDate, setTargetWeekDate] = useState(format(addWeeks(new Date(), 1), 'yyyy-MM-dd'));
  const [cloning, setCloning] = useState(false);

  const user = auth.currentUser;
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'recipes'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recipeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
      setRecipes(recipeList);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const startStr = format(weekDays[0], 'yyyy-MM-dd');
    const endStr = format(weekDays[6], 'yyyy-MM-dd');

    const q = query(
      collection(db, 'mealPlans'),
      where('userId', '==', user.uid),
      where('date', '>=', startStr),
      where('date', '<=', endStr)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plans: Record<string, MealPlan> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as MealPlan;
        plans[data.date] = { ...data, id: doc.id };
      });
      setMealPlans(plans);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, currentDate]);

  const handleMealChange = (date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'morningNotes' | 'afternoonNotes' | 'eveningNotes', value: string, recipeId?: string) => {
    setMealPlans(prev => ({
      ...prev,
      [date]: {
        ...(prev[date] || { userId: user!.uid, date, breakfast: '', lunch: '', dinner: '', notes: '' }),
        [mealType]: value,
        ...(recipeId ? { [`${mealType}RecipeId`]: recipeId } : {})
      }
    }));
  };

  const handleNotesChange = (date: string, value: string) => {
    setMealPlans(prev => ({
      ...prev,
      [date]: {
        ...(prev[date] || { userId: user!.uid, date, breakfast: '', lunch: '', dinner: '', notes: '' }),
        notes: value
      }
    }));
  };

  const saveDay = async (date: string) => {
    if (!user) return;
    setSaving(date);
    try {
      const plan = mealPlans[date];
      if (!plan) return;
      
      const docId = plan.id || `${user.uid}_${date}`;
      await setDoc(doc(db, 'mealPlans', docId), plan);
      toast.success(`Plan for ${format(parseISO(date), 'dd/MM/yyyy')} saved!`);
    } catch (error) {
      console.error("Error saving meal plan:", error);
      toast.error("Failed to save meal plan");
    } finally {
      setSaving(null);
    }
  };

  const generateShoppingList = async () => {
    if (!user) return;
    setGeneratingList(true);
    try {
      const ingredientsSet = new Set<string>();
      
      // Collect all ingredients from recipes in the current week's meal plans
      Object.values(mealPlans).forEach((plan: MealPlan) => {
        const recipeIds = [plan.breakfastRecipeId, plan.lunchRecipeId, plan.dinnerRecipeId].filter(Boolean);
        recipeIds.forEach(id => {
          const recipe = recipes.find(r => r.id === id);
          if (recipe && recipe.ingredients) {
            recipe.ingredients.split('\n').forEach(ing => {
              if (ing.trim()) ingredientsSet.add(ing.trim());
            });
          }
        });
      });

      if (ingredientsSet.size === 0) {
        toast.info("No recipes with ingredients found in this week's plan.");
        return;
      }

      const promises = Array.from(ingredientsSet).map(name => 
        addDoc(collection(db, 'shoppingItems'), {
          userId: user.uid,
          name,
          completed: false,
          createdAt: serverTimestamp()
        })
      );

      await Promise.all(promises);
      toast.success(`Added ${ingredientsSet.size} items to your shopping list!`);
    } catch (error) {
      console.error("Error generating shopping list:", error);
      toast.error("Failed to generate shopping list");
    } finally {
      setGeneratingList(false);
    }
  };

  const handleCloneWeek = async () => {
    if (!user) return;
    setCloning(true);
    try {
      const targetStart = startOfWeek(parseISO(targetWeekDate), { weekStartsOn: 1 });
      const sourceStart = startDate;
      
      const batch = writeBatch(db);
      let count = 0;

      // Iterate through each day of the source week
      for (let i = 0; i < 7; i++) {
        const sourceDay = addDays(sourceStart, i);
        const sourceDateStr = format(sourceDay, 'yyyy-MM-dd');
        const sourcePlan = mealPlans[sourceDateStr];

        if (sourcePlan) {
          const targetDay = addDays(targetStart, i);
          const targetDateStr = format(targetDay, 'yyyy-MM-dd');
          const targetDocId = `${user.uid}_${targetDateStr}`;
          
          const { id, ...planData } = sourcePlan;
          const newPlan = {
            ...planData,
            date: targetDateStr,
            userId: user.uid
          };

          batch.set(doc(db, 'mealPlans', targetDocId), newPlan);
          count++;
        }
      }

      if (count === 0) {
        toast.info("No hay planes en la semana actual para clonar.");
        return;
      }

      await batch.commit();
      toast.success(`¡Semana clonada con éxito! Se han copiado ${count} días.`);
      setIsCloneDialogOpen(false);
      
      // If the target week is the one currently being viewed, the onSnapshot will update it.
      // If it's a different week, the user will see it when they navigate there.
    } catch (error) {
      console.error("Error cloning week:", error);
      toast.error("Error al clonar la semana");
    } finally {
      setCloning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const DayContent = ({ day, dateStr, plan }: { day: Date, dateStr: string, plan: any }) => (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Breakfast */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg">
              <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">🍳 Desayuno</label>
          </div>
          <div className="bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-2xl border border-amber-100/50 dark:border-amber-900/20 transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20">
            <MealInput 
              value={plan.breakfast} 
              onChange={(val, rid) => handleMealChange(dateStr, 'breakfast', val, rid)}
              recipes={recipes}
              placeholder="¿Qué desayunamos hoy?..."
            />
          </div>
          <textarea
            value={plan.morningNotes || ''}
            onChange={(e) => handleMealChange(dateStr, 'morningNotes', e.target.value)}
            placeholder="📝 Notas de la mañana..."
            className="w-full h-12 p-3 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl resize-none focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-700 dark:text-slate-200"
          />
        </div>

        {/* Lunch */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-rose-100 dark:bg-rose-900/30 p-1.5 rounded-lg">
              <Sun className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            </div>
            <label className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">🥗 Comida</label>
          </div>
          <div className="bg-rose-50/50 dark:bg-rose-900/10 p-3 rounded-2xl border border-rose-100/50 dark:border-rose-900/20 transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20">
            <MealInput 
              value={plan.lunch} 
              onChange={(val, rid) => handleMealChange(dateStr, 'lunch', val, rid)}
              recipes={recipes}
              placeholder="Menú del mediodía..."
            />
          </div>
          <textarea
            value={plan.afternoonNotes || ''}
            onChange={(e) => handleMealChange(dateStr, 'afternoonNotes', e.target.value)}
            placeholder="📝 Notas de la tarde..."
            className="w-full h-12 p-3 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl resize-none focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-700 dark:text-slate-200"
          />
        </div>

        {/* Dinner */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded-lg">
              <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <label className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">🌙 Cena</label>
          </div>
          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
            <MealInput 
              value={plan.dinner} 
              onChange={(val, rid) => handleMealChange(dateStr, 'dinner', val, rid)}
              recipes={recipes}
              placeholder="Cena ligera..."
            />
          </div>
          <textarea
            value={plan.eveningNotes || ''}
            onChange={(e) => handleMealChange(dateStr, 'eveningNotes', e.target.value)}
            placeholder="📝 Notas de la noche..."
            className="w-full h-12 p-3 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl resize-none focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-700 dark:text-slate-200"
          />
        </div>
      </div>
      
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 px-1">
          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg">
            <StickyNote className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          </div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">📝 Notas del Día</label>
        </div>
        <textarea
          value={plan.notes}
          onChange={(e) => handleNotesChange(dateStr, e.target.value)}
          placeholder="Tareas, entrenamientos, recordatorios..."
          className="w-full h-24 p-3 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl resize-none focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-700 dark:text-slate-200"
        />
      </div>

      <Button 
        onClick={() => saveDay(dateStr)}
        disabled={saving === dateStr}
        className="w-full cursor-pointer bg-rose-500 hover:bg-rose-600 text-white rounded-2xl py-6 shadow-lg shadow-rose-200 transition-all duration-200 active:scale-[0.98]"
      >
        {saving === dateStr ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : (
          <Save className="h-5 w-5 mr-2" />
        )}
        <span className="font-bold">Guardar Día</span>
      </Button>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none gap-6">
        <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCurrentDate(addDays(currentDate, -7))} 
            className="cursor-pointer rounded-2xl h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Semana Actual</span>
            <h2 className="text-base sm:text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-rose-500" />
              {format(weekDays[0], 'dd MMM', { locale: es })} — {format(weekDays[6], 'dd MMM', { locale: es })}
            </h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCurrentDate(addDays(currentDate, 7))} 
            className="cursor-pointer rounded-2xl h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
            <DialogTrigger
              render={
                <Button 
                  variant="outline" 
                  className="flex-1 sm:flex-none cursor-pointer border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl px-6 font-bold text-sm transition-all duration-200 shadow-sm"
                />
              }
            >
              <Copy className="w-4 h-4 mr-2" />
              Clonar
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  Clonar Planificación
                </DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-slate-400">
                  Copia todos los planes de la semana actual ({format(weekDays[0], 'dd/MM')} — {format(weekDays[6], 'dd/MM')}) a otra semana.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="target-week" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Semana de Destino (selecciona cualquier día)
                  </Label>
                  <Input
                    id="target-week"
                    type="date"
                    value={targetWeekDate}
                    onChange={(e) => setTargetWeekDate(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                    Se clonará a la semana que contenga el día seleccionado (Lunes a Domingo).
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleCloneWeek} 
                  disabled={cloning}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-2xl py-6 font-bold shadow-lg shadow-rose-200 dark:shadow-none transition-all"
                >
                  {cloning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Confirmar Clonación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            onClick={generateShoppingList} 
            disabled={generatingList}
            className="flex-1 sm:flex-none cursor-pointer border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-900/50 rounded-2xl px-6 font-bold text-sm transition-all duration-200 shadow-sm"
          >
            {generatingList ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
            Auto-Shop
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setCurrentDate(new Date())} 
            className="flex-1 sm:flex-none cursor-pointer text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl px-6 font-bold text-sm transition-all duration-200"
          >
            Hoy
          </Button>
        </div>
      </div>

      {/* Desktop View: Horizontal Scrollable Track */}
      <div className="hidden lg:block relative group">
        <div className="flex overflow-x-auto pb-8 pt-2 gap-6 snap-x snap-mandatory scroll-smooth px-2">
          {weekDays.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const plan = mealPlans[dateStr] || { breakfast: '', lunch: '', dinner: '', notes: '' };
            const isToday = isSameDay(day, new Date());

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex-none w-[380px] snap-start"
              >
                <Card className={`rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900 ${isToday ? 'ring-4 ring-rose-500/20 border-rose-100 dark:border-rose-900/50' : ''}`}>
                  <CardHeader className={`p-6 pb-4 ${isToday ? 'bg-rose-50/50 dark:bg-rose-900/20' : 'bg-slate-50/30 dark:bg-slate-800/30'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {format(day, 'EEEE', { locale: es })}
                        </p>
                        <CardTitle className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
                          {format(day, 'dd')}
                          <span className="text-slate-300 dark:text-slate-600 text-sm font-medium ml-1">/{format(day, 'MM')}</span>
                        </CardTitle>
                      </div>
                      {isToday && (
                        <div className="bg-rose-500 text-white p-2 rounded-xl shadow-lg shadow-rose-200 dark:shadow-none">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-4">
                    <DayContent day={day} dateStr={dateStr} plan={plan} />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        
        {/* Visual indicators for scroll */}
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent w-20 h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent w-20 h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {weekDays.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const plan = mealPlans[dateStr] || { breakfast: '', lunch: '', dinner: '', notes: '' };
            const isToday = isSameDay(day, new Date());

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <AccordionItem 
                  value={dateStr} 
                  className={`bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 px-6 shadow-sm overflow-hidden transition-all duration-300 ${isToday ? 'ring-4 ring-rose-500/20 border-rose-100 dark:border-rose-900/50' : ''}`}
                >
                  <AccordionTrigger className="hover:no-underline py-6 group">
                    <div className="flex items-center gap-5 text-left">
                      <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-colors ${isToday ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-slate-100 dark:group-hover:bg-slate-700'}`}>
                        <span className="text-[10px] font-black uppercase leading-none mb-0.5">{format(day, 'EEE', { locale: es })}</span>
                        <span className="text-lg font-black leading-none">{format(day, 'dd')}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{format(day, 'dd MMMM', { locale: es })}</span>
                        {isToday ? (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Hoy
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Planifica tu día</span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-8">
                    <DayContent day={day} dateStr={dateStr} plan={plan} />
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
