import {
  AppShell,
  Burger,
  Group,
  Title,
  Text,
  Container,
  Stack,
  Alert,
  NavLink,
  ScrollArea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IngredientInput } from './components/IngredientInput';
import { RecipeGrid } from './components/RecipeGrid';
import { RecipeModal, RecipeDetail } from './components/RecipeModal';
import { Recipe } from './components/RecipeCard';
import { useState, useEffect } from 'react';
import { IconAlertCircle, IconBookmark } from '@tabler/icons-react';

import { API_URL } from './config';

function App() {
  const [opened, { toggle }] = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);

  // Saved Recipes State
  const [savedRecipes, setSavedRecipes] = useState<RecipeDetail[]>(() => {
    const saved = localStorage.getItem('savedRecipes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  const handleSearch = async (ingredients: string[]) => {
    setLoading(true);
    setError(null);
    setRecipes([]);

    try {
      const query = ingredients.join(',');
      const response = await fetch(
        `${API_URL}/api/recipes?ingredients=${query}`
      );

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

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3}>Culinary Gauntlet 👨‍🍳</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Text fw={500} mb="sm">
          Saved Recipes ({savedRecipes.length})
        </Text>
        <ScrollArea>
          {savedRecipes.length === 0 && (
            <Text c="dimmed" size="sm">
              No saved recipes yet.
            </Text>
          )}
          {savedRecipes.map((recipe) => (
            <NavLink
              key={recipe.id}
              label={recipe.title}
              leftSection={<IconBookmark size={16} />}
              onClick={() => handleRecipeClick(recipe.id)}
              variant="subtle"
              active={selectedRecipeId === recipe.id}
            />
          ))}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg">
          <Stack gap="xl">
            <Stack gap="xs">
              <Title order={2}>What's in your kitchen?</Title>
              <Text c="dimmed">
                Enter the ingredients you have, and we'll find the perfect
                recipe for you.
              </Text>
            </Stack>

            <IngredientInput onSearch={handleSearch} loading={loading} />

            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Bummer!"
                color="red"
              >
                {error}
              </Alert>
            )}

            {recipes.length > 0 && (
              <Stack>
                <Title order={3}>We found {recipes.length} recipes!</Title>
                <RecipeGrid
                  recipes={recipes}
                  onRecipeClick={handleRecipeClick}
                />
              </Stack>
            )}
          </Stack>
        </Container>

        <RecipeModal
          opened={modalOpened}
          onClose={closeModal}
          recipeId={selectedRecipeId}
          onToggleSave={toggleSaveRecipe}
          isSaved={selectedRecipeId ? isRecipeSaved(selectedRecipeId) : false}
        />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
