import { Modal, Button, Text, TextInput, Stack, Group, ThemeIcon, List } from '@mantine/core';
import { IconSparkles, IconCheck, IconMail } from '@tabler/icons-react';
import { useState } from 'react';
import { API_URL } from '../config';

interface PremiumModalProps {
  opened: boolean;
  onClose: () => void;
  onUnlock: (email: string) => void;
}

export function PremiumModal({ opened, onClose, onUnlock }: PremiumModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!response.ok) {
        console.error('Failed to subscribe');
        // We unlock anyway for MVP UX, but you might want to show error
      }
      
      onUnlock(email);
      onClose();
    } catch (error) {
      console.error('Error subscribing:', error);
      // Fallback: still unlock if API fails (don't block user)
      onUnlock(email);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={<Group><IconSparkles color="gold" fill="gold" /> <Text fw={700}>Unlock AI Chef Vision</Text></Group>}
      centered
      size="md"
    >
      <Stack gap="md">
        <Text size="sm">
          Stop typing ingredients manually! Let our advanced AI analyze your fridge photos and suggest recipes instantly.
        </Text>

        <List
          spacing="xs"
          size="sm"
          center
          icon={
            <ThemeIcon color="teal" size={24} radius="xl">
              <IconCheck size={16} />
            </ThemeIcon>
          }
        >
          <List.Item>Instant ingredient detection</List.Item>
          <List.Item>Smart recipe matching</List.Item>
          <List.Item>Save unlimited recipes</List.Item>
        </List>

        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <TextInput
              required
              label="Enter your email to unlock"
              placeholder="chef@example.com"
              leftSection={<IconMail size={16} />}
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              type="email"
            />
            
            <Button 
              type="submit" 
              fullWidth 
              size="md" 
              color="grape" 
              loading={loading}
              variant="gradient" 
              gradient={{ from: 'grape', to: 'pink', deg: 45 }}
            >
              Unlock Free Access
            </Button>
            
            <Text size="xs" c="dimmed" ta="center">
              Limited time offer. No credit card required.
            </Text>
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
}
