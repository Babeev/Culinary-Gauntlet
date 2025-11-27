import { SimpleGrid } from '@mantine/core';
import { Recipe, RecipeCard } from './RecipeCard';

interface RecipeGridProps {
  recipes: Recipe[];
  onRecipeClick: (id: number) => void;
}

export function RecipeGrid({ recipes, onRecipeClick }: RecipeGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onClick={() => onRecipeClick(recipe.id)}
        />
      ))}
    </SimpleGrid>
  );
}
