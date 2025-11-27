import { Container, Stack, Title, Text, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { IngredientInput } from '../components/IngredientInput';
import { RecipeGrid } from '../components/RecipeGrid';
import { RecipeModal, RecipeDetail } from '../components/RecipeModal';
import { MealLogData } from '../components/MealCheckInModal';
import { Recipe } from '../components/RecipeCard';
import { useDisclosure } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useSearchParams } from 'react-router-dom';

interface HomePageProps {
  isPremium: boolean;
  onUnlockPremium: (email: string) => void;
  onPremiumAction: () => boolean;
  savedRecipes: RecipeDetail[];
  onToggleSave: (recipe: RecipeDetail) => void;
  isRecipeSaved: (id: number) => boolean;
  onLogMeal: (log: MealLogData & { recipeId: number; recipeTitle: string }) => void;
}

export function HomePage({
  isPremium,
  onPremiumAction,
  onToggleSave,
  isRecipeSaved,
  onLogMeal,
}: HomePageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Modal States
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  // Effect to handle opening recipe from URL (e.g. clicked from saved recipes)
  useEffect(() => {
    const recipeIdParam = searchParams.get('recipeId');
    if (recipeIdParam) {
        const id = parseInt(recipeIdParam, 10);
        if (!isNaN(id)) {
            setSelectedRecipeId(id);
            openModal();
        }
    }
  }, [searchParams, openModal]);

  const handleCloseModal = () => {
    closeModal();
    // Clear the query param when closing
    if (searchParams.get('recipeId')) {
        searchParams.delete('recipeId');
        setSearchParams(searchParams);
    }
  };

  const handleSearch = async (ingredients: string[]) => {
    setLoading(true);
    setError(null);
    setRecipes([]);

    try {
      const query = ingredients.join(',');
      const response = await fetch(`${API_URL}/api/recipes?ingredients=${query}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      const sortedData = (data as Recipe[]).sort(
        (a, b) => a.missedIngredientCount - b.missedIngredientCount
      );
      setRecipes(sortedData);
    } catch (err) {
      console.error(err);
      setError('Something went wrong while fetching recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = (id: number) => {
    setSelectedRecipeId(id);
    openModal();
  };

  const handleCook = (recipe: RecipeDetail) => {
    onLogMeal({
        recipeId: recipe.id,
        recipeTitle: recipe.title
    });
    handleCloseModal();
  };

  return (
    <Container size="lg">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={2}>What's in your kitchen?</Title>
          <Text c="dimmed">
            Enter the ingredients you have, and we'll find the perfect recipe for you.
          </Text>
        </Stack>

        <IngredientInput
          onSearch={handleSearch}
          loading={loading}
          onPremiumCheck={onPremiumAction}
          isPremium={isPremium}
        />

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Bummer!" color="red">
            {error}
          </Alert>
        )}

        {recipes.length > 0 && (
          <Stack>
            <Title order={3}>We found {recipes.length} recipes!</Title>
            <RecipeGrid recipes={recipes} onRecipeClick={handleRecipeClick} />
          </Stack>
        )}
      </Stack>

      <RecipeModal
        opened={modalOpened}
        onClose={handleCloseModal}
        recipeId={selectedRecipeId}
        onToggleSave={onToggleSave}
        isSaved={selectedRecipeId ? isRecipeSaved(selectedRecipeId) : false}
        onCook={handleCook}
      />
    </Container>
  );
}
