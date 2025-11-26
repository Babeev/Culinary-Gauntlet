import { AppShell, Burger, Group, Title, Text, Container } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

function App() {
  const [opened, { toggle }] = useDisclosure();

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
        <Text>Navbar content</Text>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container>
          <Text>Welcome to the Iron Chef Generator! (Content goes here)</Text>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
