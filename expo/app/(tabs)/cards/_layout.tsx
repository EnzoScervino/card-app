import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function CardsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark.background },
      }}
    />
  );
}
