import React, { useState, useEffect } from 'react';
import { db, auth } from '@/src/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Recipe } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit2, Trash2, X, Save, Loader2, UtensilsCrossed } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function RecipeManager() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    ingredients: '',
    instructions: ''
  });

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'recipes'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recipeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
      setRecipes(recipeList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenDialog = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions
      });
    } else {
      setEditingRecipe(null);
      setFormData({ name: '', ingredients: '', instructions: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name) return;

    setSubmitting(true);
    try {
      if (editingRecipe) {
        await updateDoc(doc(db, 'recipes', editingRecipe.id!), {
          ...formData
        });
        toast.success("Recipe updated!");
      } else {
        await addDoc(collection(db, 'recipes'), {
          ...formData,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        toast.success("Recipe added!");
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast.error("Failed to save recipe");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;
    try {
      await deleteDoc(doc(db, 'recipes', id));
      toast.success("Recipe deleted");
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("Failed to delete recipe");
    }
  };

  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.ingredients.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="relative w-full sm:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-rose-500 transition-colors" />
          <Input 
            placeholder="Buscar recetas... 🍳" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all h-12 font-medium text-slate-700 dark:text-slate-200"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button onClick={() => handleOpenDialog()} className="cursor-pointer bg-rose-500 hover:bg-rose-600 text-white rounded-2xl h-12 px-8 font-bold shadow-lg shadow-rose-200 dark:shadow-none transition-all active:scale-95 w-full sm:w-auto" />
            }
          >
            <Plus className="w-5 h-5 mr-2" />
            Nueva Receta
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
            <DialogHeader className="p-8 pb-0">
              <DialogTitle className="text-2xl font-black text-slate-800 dark:text-white">{editingRecipe ? 'Editar Receta 📝' : 'Nueva Receta ✨'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Nombre de la Receta</label>
                <Input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="ej. Pasta Carbonara 🍝"
                  className="rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all h-12 px-5 font-semibold text-slate-700 dark:text-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Ingredientes</label>
                <Textarea 
                  value={formData.ingredients}
                  onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                  placeholder="Lista de ingredientes (uno por línea)..."
                  className="rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all min-h-[120px] p-5 font-medium text-slate-600 dark:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Instrucciones</label>
                <Textarea 
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                  placeholder="Paso a paso para cocinar..."
                  className="rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all min-h-[180px] p-5 font-medium text-slate-600 dark:text-slate-300"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={submitting} className="cursor-pointer bg-rose-500 hover:bg-rose-600 text-white rounded-2xl h-14 w-full font-black text-lg shadow-lg shadow-rose-200 dark:shadow-none transition-all active:scale-95">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                  {editingRecipe ? 'Actualizar Receta' : 'Guardar Receta'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 p-20 text-center space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-12 h-12 text-slate-200 dark:text-slate-700" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">No hay recetas todavía</h3>
          <p className="text-slate-400 dark:text-slate-500 max-w-xs mx-auto font-medium">¡Empieza a guardar tus platos favoritos para planificar tu semana!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.id} className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900 group">
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-2xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-rose-600 transition-colors">{recipe.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(recipe)} className="h-10 w-10 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl cursor-pointer transition-all">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(recipe.id!)} className="h-10 w-10 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl cursor-pointer transition-all">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                {recipe.ingredients && (
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Ingredientes</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-wrap font-medium leading-relaxed">{recipe.ingredients}</p>
                  </div>
                )}
                {recipe.instructions && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Instrucciones</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 whitespace-pre-wrap font-medium leading-relaxed italic">{recipe.instructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
