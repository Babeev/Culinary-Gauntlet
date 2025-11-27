import { Modal, Stack, Text, Button, Group, Slider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMoodSmile } from '@tabler/icons-react';
import { useEffect } from 'react';

export interface MealLogData {
  mood?: number;
  energy?: number;
  brainFog?: number;
  sleepiness?: number;
}

export interface FeelingLog extends MealLogData {
  id: string;
  date: string;
}

interface MealCheckInModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: MealLogData) => void;
  recipeTitle?: string;
  initialValues?: MealLogData;
}

export function MealCheckInModal({
  opened,
  onClose,
  onSubmit,
  recipeTitle,
  initialValues,
}: MealCheckInModalProps) {
  const form = useForm({
    initialValues: {
      mood: 50,
      energy: 50,
      brainFog: 50,
      sleepiness: 50,
      ...initialValues,
    },
  });

  // Update form values when initialValues change or modal opens
  useEffect(() => {
    if (opened) {
        form.setValues({
            mood: initialValues?.mood ?? 50,
            energy: initialValues?.energy ?? 50,
            brainFog: initialValues?.brainFog ?? 50,
            sleepiness: initialValues?.sleepiness ?? 50,
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, initialValues]);

  const handleSubmit = (values: typeof form.values) => {
    onSubmit(values);
    onClose();
    // Don't reset here if we want to keep values, but usually we want to reset for next time?
    // Since we set values on open, reset might not be needed, but safe.
    form.reset();
  };

  const marks = [
    { value: 0, label: 'Low' },
    { value: 50, label: 'Neutral' },
    { value: 100, label: 'High' },
  ];

  return (
    <Modal opened={opened} onClose={onClose} title="Check-in 📝" centered>
      <Stack>
        <Text size="sm" c="dimmed">
            {recipeTitle ? (
                <>You cooked <b>{recipeTitle}</b>! How are you feeling?</>
            ) : (
                <>How are you feeling right now?</>
            )}
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="xl">
            <div>
              <Text size="sm" fw={500} mb="xs">
                Mood (Unpleasant ➡️ Pleasant)
              </Text>
              <Slider
                color="blue"
                marks={marks}
                step={10}
                {...form.getInputProps('mood')}
              />
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">
                Energy Level (Tired ➡️ Energetic)
              </Text>
              <Slider
                color="yellow"
                marks={marks}
                step={10}
                {...form.getInputProps('energy')}
              />
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">
                Mental Clarity (Foggy ➡️ Clear)
              </Text>
              <Slider
                color="teal"
                marks={marks}
                step={10}
                {...form.getInputProps('brainFog')}
              />
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">
                Sleepiness (Wide Awake ➡️ Sleepy)
              </Text>
              <Slider
                color="indigo"
                marks={marks}
                step={10}
                {...form.getInputProps('sleepiness')}
              />
            </div>

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" leftSection={<IconMoodSmile size={16} />}>
                Save Check-in
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
}
