import {
  AppShell,
  Burger,
  Group,
  Title,
  Text,
  Container,
  Stack,
  Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IngredientInput } from './components/IngredientInput';
import { RecipeGrid } from './components/RecipeGrid';
import type { Recipe } from './components/RecipeCard';
import { useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';

function App() {
  const [opened, { toggle }] = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (ingredients: string[]) => {
    setLoading(true);
    setError(null);
    setRecipes([]);

    try {
      const query = ingredients.join(',');
      const response = await fetch(
        `http://localhost:3000/api/recipes?ingredients=${query}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      setRecipes(data);
    } catch (err) {
      console.error(err);
      setError('Something went wrong while fetching recipes. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
          />
          <Title order={3}>Culinary Gauntlet 👨‍🍳</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Text>Saved Recipes (Coming Soon)</Text>
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
                <RecipeGrid recipes={recipes} />
              </Stack>
            )}
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
