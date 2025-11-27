import { Card, Image, Text, Badge, Button, Group, Stack } from '@mantine/core';

export interface Recipe {
  id: number;
  title: string;
  image: string;
  missedIngredientCount: number;
  missedIngredients: { name: string }[];
}

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image
          src={recipe.image}
          height={160}
          alt={recipe.title}
          fallbackSrc="https://placehold.co/600x400?text=No+Image"
        />
      </Card.Section>

      <Stack mt="md" mb="xs" gap="xs">
        <Text fw={500} truncate="end">
          {recipe.title}
        </Text>

        <Group gap="xs">
          <Badge color="pink" variant="light">
            Missing: {recipe.missedIngredientCount}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed" lineClamp={2}>
          Missing: {recipe.missedIngredients.map((i) => i.name).join(', ')}
        </Text>
      </Stack>

      <Button
        variant="light"
        color="blue"
        fullWidth
        mt="auto"
        radius="md"
        onClick={onClick}
      >
        View Recipe
      </Button>
    </Card>
  );
}
