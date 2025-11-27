import {
  AppShell,
  Group,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Routes, Route, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { HomePage } from './pages/HomePage';
import { JournalPage, MealLog } from './pages/JournalPage';
import { AdminPage } from './components/AdminPage';
import { RecipeDetail } from './components/RecipeModal';
import { MealLogData, FeelingLog } from './components/MealCheckInModal';
import { PremiumModal } from './components/PremiumModal';
import { MainLayout } from './components/MainLayout';

function AdminLayout() {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md">
          <Title order={3}>Culinary Gauntlet 👨‍🍳</Title>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

function App() {
  // Premium Status
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem('isPremium') === 'true';
  });
  
  const [
    premiumModalOpened,
    { open: openPremiumModal, close: closePremiumModal },
  ] = useDisclosure(false);

  // Saved Recipes State
  const [savedRecipes, setSavedRecipes] = useState<RecipeDetail[]>(() => {
    const saved = localStorage.getItem('savedRecipes');
    return saved ? JSON.parse(saved) : [];
  });

  // Meal Logs State
  const [mealLogs, setMealLogs] = useState<MealLog[]>(() => {
    const logs = localStorage.getItem('mealLogs');
    return logs ? JSON.parse(logs) : [];
  });

  // Feeling Logs State
  const [feelingLogs, setFeelingLogs] = useState<FeelingLog[]>(() => {
    const logs = localStorage.getItem('feelingLogs');
    return logs ? JSON.parse(logs) : [];
  });

  useEffect(() => {
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  useEffect(() => {
    localStorage.setItem('mealLogs', JSON.stringify(mealLogs));
  }, [mealLogs]);

  useEffect(() => {
    localStorage.setItem('feelingLogs', JSON.stringify(feelingLogs));
  }, [feelingLogs]);


  const toggleSaveRecipe = (recipe: RecipeDetail) => {
    setSavedRecipes((prev) => {
      const isSaved = prev.some((r) => r.id === recipe.id);
      if (isSaved) {
        return prev.filter((r) => r.id !== recipe.id);
      } else {
        return [...prev, recipe];
      }
    });
  };

  const isRecipeSaved = (id: number) => {
    return savedRecipes.some((r) => r.id === id);
  };

  const handlePremiumAction = () => {
    if (isPremium) {
      return true;
    } else {
      openPremiumModal();
      return false;
    }
  };

  const handleUnlock = (email: string) => {
    console.log('User unlocked premium with email:', email);
    localStorage.setItem('isPremium', 'true');
    setIsPremium(true);
  };

  const handleLogMeal = (data: MealLogData & { recipeId: number; recipeTitle: string }) => {
    const newLog: MealLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      ...data,
    };

    setMealLogs((prev) => [newLog, ...prev]);
    console.log('Meal Logged:', newLog);
  };

  const handleLogFeeling = (data: MealLogData) => {
    const newLog: FeelingLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      ...data,
    };
    setFeelingLogs((prev) => [newLog, ...prev]);
  };

  return (
    <>
      <Routes>
        <Route element={<MainLayout savedRecipes={savedRecipes} />}>
          <Route path="/" element={
              <HomePage 
                  isPremium={isPremium}
                  onUnlockPremium={handleUnlock}
                  onPremiumAction={handlePremiumAction}
                  savedRecipes={savedRecipes}
                  onToggleSave={toggleSaveRecipe}
                  isRecipeSaved={isRecipeSaved}
                  onLogMeal={handleLogMeal}
              />
          } />
          <Route path="/journal" element={
              <JournalPage 
                  logs={mealLogs} 
                  feelingLogs={feelingLogs}
                  onLogFeeling={handleLogFeeling} 
              />
          } />
        </Route>
        
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
      
      <PremiumModal
        opened={premiumModalOpened}
        onClose={closePremiumModal}
        onUnlock={handleUnlock}
      />
    </>
  );
}

export default App;
