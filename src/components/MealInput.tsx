import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Recipe } from '@/src/types';

interface MealInputProps {
  value: string;
  onChange: (value: string, recipeId?: string) => void;
  recipes: Recipe[];
  placeholder?: string;
}

export default function MealInput({ value, onChange, recipes, placeholder }: MealInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSelect = (recipeName: string, recipeId: string) => {
    onChange(recipeName, recipeId);
    setOpen(false);
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative flex items-center group">
        <input
          type="text"
          value={inputValue}
          onChange={handleManualChange}
          placeholder={placeholder || "¿Qué hay para comer?"}
          className="w-full px-0 py-1 text-sm bg-transparent border-none focus:ring-0 transition-all pr-8 font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-normal"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                role="combobox"
                aria-expanded={open}
                className="absolute right-0 h-8 w-8 p-0 hover:bg-white/50 dark:hover:bg-slate-800 rounded-xl cursor-pointer text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              />
            }
          >
            <Search className="h-4 w-4 shrink-0" />
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0 rounded-2xl border-slate-100 dark:border-slate-800 shadow-2xl dark:shadow-none bg-white dark:bg-slate-900" align="end">
            <Command className="rounded-2xl bg-white dark:bg-slate-900">
              <CommandInput placeholder="Buscar en mis recetas..." className="border-none focus:ring-0 dark:text-slate-200" />
              <CommandList>
                <CommandEmpty className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">No se encontraron recetas.</CommandEmpty>
                <CommandGroup heading="Tus Recetas" className="px-2 text-slate-400 dark:text-slate-500">
                  {recipes.map((recipe) => (
                    <CommandItem
                      key={recipe.id}
                      value={recipe.name}
                      onSelect={() => handleSelect(recipe.name, recipe.id!)}
                      className="cursor-pointer rounded-xl aria-selected:bg-rose-50 dark:aria-selected:bg-rose-900/20 aria-selected:text-rose-700 dark:aria-selected:text-rose-300 py-3 text-slate-700 dark:text-slate-200"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-rose-600 dark:text-rose-400",
                          value === recipe.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-medium">{recipe.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
