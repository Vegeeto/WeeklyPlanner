import React, { useState, useEffect } from 'react';
import { db, auth } from '@/src/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ShoppingItem } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CheckCircle2, Circle, Loader2, ShoppingBasket } from 'lucide-react';
import { toast } from 'sonner';

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'shoppingItems'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingItem));
      // Sort: uncompleted first, then by creation date
      itemList.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return 0;
      });
      setItems(itemList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newItemName.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'shoppingItems'), {
        userId: user.uid,
        name: newItemName.trim(),
        completed: false,
        createdAt: serverTimestamp()
      });
      setNewItemName('');
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComplete = async (item: ShoppingItem) => {
    try {
      await updateDoc(doc(db, 'shoppingItems', item.id!), {
        completed: !item.completed
      });
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'shoppingItems', id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const clearCompleted = async () => {
    const completedItems = items.filter(i => i.completed);
    if (completedItems.length === 0) return;
    
    try {
      const promises = completedItems.map(item => deleteDoc(doc(db, 'shoppingItems', item.id!)));
      await Promise.all(promises);
      toast.success("Cleared completed items");
    } catch (error) {
      console.error("Error clearing items:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="p-8 pb-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">Tu Compra</span>
              <CardTitle className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <div className="bg-rose-500 p-2 rounded-xl shadow-lg shadow-rose-200 dark:shadow-none">
                  <ShoppingBasket className="w-6 h-6 text-white" />
                </div>
                Lista de Compra 🛒
              </CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearCompleted}
              className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer rounded-xl px-4 transition-all duration-200"
            >
              Limpiar Completados
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleAddItem} className="p-6 bg-white dark:bg-slate-900 flex gap-3 border-b border-slate-50 dark:border-slate-800">
            <Input 
              placeholder="Añadir algo a la lista... 🍎" 
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all h-12 px-5 font-medium text-slate-700 dark:text-slate-200"
            />
            <Button type="submit" disabled={submitting} className="cursor-pointer bg-rose-500 hover:bg-rose-600 text-white rounded-2xl h-12 w-12 shadow-lg shadow-rose-200 dark:shadow-none transition-all active:scale-95">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </Button>
          </form>

          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {items.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ShoppingBasket className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                </div>
                <div className="space-y-2">
                  <p className="text-slate-800 dark:text-white font-black text-lg">¡Nevera llena! 🥦</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 max-w-[250px] mx-auto leading-relaxed">No hay nada en la lista. Añade items manualmente o usa "Auto-Shop" desde el calendario.</p>
                </div>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group">
                  <div 
                    className="flex items-center gap-4 cursor-pointer flex-1"
                    onClick={() => toggleComplete(item)}
                  >
                    <div className={`transition-all duration-300 ${item.completed ? 'scale-110' : 'scale-100'}`}>
                      {item.completed ? (
                        <div className="bg-rose-100 dark:bg-rose-900/30 p-1 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                      ) : (
                        <Circle className="w-5 h-5 text-slate-200 dark:text-slate-700 group-hover:text-rose-400 transition-colors" />
                      )}
                    </div>
                    <span className={`text-sm font-semibold transition-all duration-300 ${item.completed ? 'text-slate-300 dark:text-slate-600 line-through italic' : 'text-slate-700 dark:text-slate-200'}`}>
                      {item.name}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(item.id!)}
                    className="h-10 w-10 text-slate-200 dark:text-slate-700 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
