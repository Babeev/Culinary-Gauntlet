import { Container, Title, Table, Text, Paper, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import { API_URL } from '../config';

interface Subscriber {
  id: number;
  email: string;
  created_at: string;
}

export function AdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/subscribers`);
        const data = await response.json();
        setSubscribers(data.subscribers);
      } catch (error) {
        console.error('Failed to fetch subscribers', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, []);

  if (loading) return <Text>Loading...</Text>;

  return (
    <Container size="md" py="xl">
      <Paper shadow="sm" p="md" withBorder>
        <Stack gap="md">
          <Title order={2}>✨ Subscribers ({subscribers.length})</Title>
          
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {subscribers.map((sub) => (
                <Table.Tr key={sub.id}>
                  <Table.Td>{sub.id}</Table.Td>
                  <Table.Td>{sub.email}</Table.Td>
                  <Table.Td>{new Date(sub.created_at).toLocaleString()}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>
    </Container>
  );
}

