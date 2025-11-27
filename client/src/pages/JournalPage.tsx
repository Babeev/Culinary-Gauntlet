import { Container, Title, Text, Stack, Paper, ScrollArea, Table, Button, SimpleGrid } from '@mantine/core';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MealLogData, MealCheckInModal, FeelingLog } from '../components/MealCheckInModal';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';

export interface MealLog extends MealLogData {
  id: string;
  recipeId: number;
  recipeTitle: string;
  date: string;
}

interface JournalPageProps {
  logs: MealLog[];
  feelingLogs: FeelingLog[];
  onLogFeeling: (data: MealLogData) => void;
}

export function JournalPage({ logs, feelingLogs, onLogFeeling }: JournalPageProps) {
  const [checkInOpened, { open: openCheckIn, close: closeCheckIn }] = useDisclosure(false);

  // Format data for the chart
  const chartData = feelingLogs
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((log) => ({
      ...log,
      formattedDate: new Date(log.date).toLocaleDateString() + ' ' + new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    }));

  const handleCheckInSubmit = (data: MealLogData) => {
    onLogFeeling(data);
    closeCheckIn();
  };

  return (
    <Container size="lg">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={2}>Your Food Journal 📊</Title>
          <Text c="dimmed">
            Track your meals and feelings separately to find patterns.
          </Text>
          <Button 
            leftSection={<IconPlus size={16} />} 
            onClick={openCheckIn}
            style={{ alignSelf: 'flex-start' }}
          >
            Check In Feeling
          </Button>
        </Stack>

        {feelingLogs.length > 0 && (
             <Paper p="md" withBorder radius="md">
              <Title order={4} mb="md">Mood & Energy Trends</Title>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedDate" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="mood"
                      stroke="#228be6"
                      name="Mood"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="energy"
                      stroke="#fab005"
                      name="Energy"
                      strokeWidth={2}
                    />
                     <Line
                      type="monotone"
                      dataKey="brainFog"
                      stroke="#12b886"
                      name="Mental Clarity"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="sleepiness"
                      stroke="#7950f2"
                      name="Sleepiness"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Paper>
        )}
        
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Paper p="md" withBorder radius="md">
               <Title order={4} mb="md">Meal History</Title>
               <ScrollArea h={300}>
                {logs.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">No meals logged yet.</Text>
                ) : (
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Date</Table.Th>
                          <Table.Th>Meal</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {logs.map((log) => (
                          <Table.Tr key={log.id}>
                            <Table.Td>{new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Table.Td>
                            <Table.Td>{log.recipeTitle}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                )}
               </ScrollArea>
            </Paper>

            <Paper p="md" withBorder radius="md">
               <Title order={4} mb="md">Feeling Reports</Title>
               <ScrollArea h={300}>
                {feelingLogs.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">No feelings reported yet.</Text>
                ) : (
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Date</Table.Th>
                          <Table.Th>Mood</Table.Th>
                          <Table.Th>Energy</Table.Th>
                          <Table.Th>Clarity</Table.Th>
                          <Table.Th>Sleepiness</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {feelingLogs.map((log) => (
                          <Table.Tr key={log.id}>
                            <Table.Td>{new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Table.Td>
                            <Table.Td>{log.mood}</Table.Td>
                            <Table.Td>{log.energy}</Table.Td>
                            <Table.Td>{log.brainFog}</Table.Td>
                            <Table.Td>{log.sleepiness}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                )}
               </ScrollArea>
            </Paper>
        </SimpleGrid>
      </Stack>
      
      <MealCheckInModal 
        opened={checkInOpened} 
        onClose={closeCheckIn} 
        onSubmit={handleCheckInSubmit}
      />
    </Container>
  );
}
