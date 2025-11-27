import { useState } from 'react';
import { TagsInput, Button, Stack, Group, FileButton, Loader } from '@mantine/core';
import { IconSearch, IconCarrot, IconCamera } from '@tabler/icons-react';
import { API_URL } from '../config';

interface IngredientInputProps {
  onSearch: (ingredients: string[]) => void;
  loading?: boolean;
}

export function IngredientInput({ onSearch, loading }: IngredientInputProps) {
  const [value, setValue] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const handleSearch = () => {
    if (value.length > 0) {
      onSearch(value);
    }
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_URL}/api/ingredients/image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to analyze image');

      const data = await response.json();
      // Add new detected ingredients to existing ones, avoiding duplicates
      const newIngredients = data.ingredients.filter(
        (ing: string) => !value.includes(ing)
      );
      setValue((prev) => [...prev, ...newIngredients]);
    } catch (error) {
      console.error(error);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
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
        maxTags={20}
      />
      <Group justify="space-between">
        <FileButton onChange={handleImageUpload} accept="image/png,image/jpeg,image/heic,image/heif">
          {(props) => (
            <Button
              {...props}
              variant="light"
              color="teal"
              leftSection={analyzing ? <Loader size="xs" /> : <IconCamera size={20} />}
              disabled={analyzing || loading}
            >
              {analyzing ? 'Analyzing...' : 'Snap Fridge'}
            </Button>
          )}
        </FileButton>

        <Button
          leftSection={<IconSearch size={20} />}
          onClick={handleSearch}
          loading={loading}
          disabled={value.length === 0 || analyzing}
          variant="filled"
          color="blue"
        >
          {loading ? 'Searching...' : 'Find Recipes'}
        </Button>
      </Group>
    </Stack>
  );
}
