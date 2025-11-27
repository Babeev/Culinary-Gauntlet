import { AppShell, Burger, Group, Title, Stack, NavLink, Text, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { IconHome, IconChartBar, IconBookmark } from '@tabler/icons-react';
import { RecipeDetail } from './RecipeModal';

interface MainLayoutProps {
  savedRecipes: RecipeDetail[];
}

export function MainLayout({ savedRecipes }: MainLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();

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
        <Stack gap="xs" mb="xl">
          <NavLink
            label="Kitchen"
            leftSection={<IconHome size={20} />}
            component={Link}
            to="/"
            active={location.pathname === '/'}
            onClick={() => opened && toggle()}
          />
          <NavLink
            label="Journal"
            leftSection={<IconChartBar size={20} />}
            component={Link}
            to="/journal"
            active={location.pathname === '/journal'}
            onClick={() => opened && toggle()}
          />
        </Stack>

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
              onClick={() => {
                // Close the navbar if on mobile
                if (opened) toggle();

                // Navigate to home to ensure we are on the right page
                navigate('/');

                // Signal which recipe to open via query param
                navigate(`/?recipeId=${recipe.id}`);
              }}
              variant="subtle"
            />
          ))}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

