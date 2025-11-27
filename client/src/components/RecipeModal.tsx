import {
  Modal,
  Image,
  Text,
  Badge,
  Group,
  List,
  Title,
  LoadingOverlay,
  ScrollArea,
  Button,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { IconBookmark, IconBookmarkFilled } from '@tabler/icons-react';
import { API_URL } from '../config';

export interface RecipeDetail {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
  instructions: string;
  extendedIngredients: {
    id: number;
    original: string;
  }[];
}

interface RecipeModalProps {
  recipeId: number | null;
  opened: boolean;
  onClose: () => void;
  onToggleSave: (recipe: RecipeDetail) => void;
  isSaved: boolean;
}

export function RecipeModal({
  recipeId,
  opened,
  onClose,
  onToggleSave,
  isSaved,
}: RecipeModalProps) {
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opened && recipeId) {
      fetchRecipeDetails(recipeId);
    } else {
      setRecipe(null);
    }
  }, [opened, recipeId]);

  const fetchRecipeDetails = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/recipes/${id}`);
      if (!response.ok) throw new Error('Failed to fetch details');
      const data = await response.json();
      setRecipe(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title={recipe?.title}
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <LoadingOverlay
        visible={loading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
      />

      {recipe && (
        <>
          <Image
            src={recipe.image}
            height={250}
            alt={recipe.title}
            radius="md"
            mb="md"
          />

          <Group mb="md" justify="space-between">
            <Group>
              <Badge color="blue">Ready in {recipe.readyInMinutes} mins</Badge>
              <Badge color="green">Servings: {recipe.servings}</Badge>
            </Group>
            <Button
              variant={isSaved ? 'filled' : 'light'}
              color={isSaved ? 'yellow' : 'gray'}
              leftSection={
                isSaved ? (
                  <IconBookmarkFilled size={20} />
                ) : (
                  <IconBookmark size={20} />
                )
              }
              onClick={() => onToggleSave(recipe)}
            >
              {isSaved ? 'Saved' : 'Save Recipe'}
            </Button>
          </Group>

          <Title order={4} mb="xs">
            Ingredients
          </Title>
          <List mb="md" withPadding>
            {recipe.extendedIngredients.map((ing) => (
              <List.Item key={ing.id}>{ing.original}</List.Item>
            ))}
          </List>

          <Title order={4} mb="xs">
            Instructions
          </Title>
          <Text
            dangerouslySetInnerHTML={{ __html: recipe.summary }}
            size="sm"
            c="dimmed"
            mb="md"
          />
          <Text dangerouslySetInnerHTML={{ __html: recipe.instructions }} />
        </>
      )}
    </Modal>
  );
}
