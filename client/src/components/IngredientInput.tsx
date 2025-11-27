import { useState } from 'react';
import {
  TagsInput,
  Button,
  Stack,
  Group,
  FileButton,
  Loader,
  Tooltip,
} from '@mantine/core';
import { IconSearch, IconCarrot, IconCamera, IconLock } from '@tabler/icons-react';
import { API_URL } from '../config';

interface IngredientInputProps {
  onSearch: (ingredients: string[]) => void;
  loading?: boolean;
  onPremiumCheck: () => boolean;
  isPremium: boolean;
}

export function IngredientInput({
  onSearch,
  loading,
  onPremiumCheck,
  isPremium,
}: IngredientInputProps) {
  const [value, setValue] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const handleSearch = () => {
    if (value.length > 0) {
      onSearch(value);
    }
  };

  const handleImageUpload = async (file: File | null) => {
    // Check if premium is unlocked
    if (!onPremiumCheck()) {
      // If not premium, the modal will open via the callback, so we stop here.
      return;
    }

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
        {/* 
            If NOT premium, we wrap the button in a plain onClick handler instead of FileButton 
            because FileButton opens the system dialog immediately.
        */}
        {!isPremium ? (
          <Tooltip label="Unlock AI Features" withArrow>
            <Button
              variant="light"
              color="indigo"
              leftSection={<IconLock size={20} />}
              onClick={() => onPremiumCheck()}
            >
              Snap Fridge
            </Button>
          </Tooltip>
        ) : (
          <FileButton
            onChange={handleImageUpload}
            accept="image/png,image/jpeg,image/heic,image/heif"
          >
            {(props) => (
              <Button
                {...props}
                variant="light"
                color="teal"
                leftSection={
                  analyzing ? <Loader size="xs" /> : <IconCamera size={20} />
                }
                disabled={analyzing || loading}
              >
                {analyzing ? 'Analyzing...' : 'Snap Fridge'}
              </Button>
            )}
          </FileButton>
        )}

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
