import { useState } from 'react';
import { TagsInput, Button, Stack, Group } from '@mantine/core';
import { IconSearch, IconCarrot } from '@tabler/icons-react';

interface IngredientInputProps {
  onSearch: (ingredients: string[]) => void;
  loading?: boolean;
}

export function IngredientInput({ onSearch, loading }: IngredientInputProps) {
  const [value, setValue] = useState<string[]>([]);

  const handleSearch = () => {
    if (value.length > 0) {
      onSearch(value);
    }
  };

  return (
    <Stack>
      <TagsInput
        label="What's in your fridge?"
        description="Type an ingredient and press Enter"
        placeholder="e.g. chicken, rice, broccoli"
        leftSection={<IconCarrot size={16} />}
        value={value}
        onChange={setValue}
        clearable
        maxTags={10}
      />
      <Group justify="flex-end">
        <Button
          leftSection={<IconSearch size={20} />}
          onClick={handleSearch}
          loading={loading}
          disabled={value.length === 0}
          variant="filled"
          color="blue"
        >
          Find Recipes
        </Button>
      </Group>
    </Stack>
  );
}

