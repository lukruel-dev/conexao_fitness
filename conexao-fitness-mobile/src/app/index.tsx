import { View, Text } from '@/tw';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-100">
      <StatusBar style="auto" />
      <View className="p-8 bg-white rounded-2xl shadow-sm items-center">
        <Text className="text-2xl font-bold text-sf-blue mb-2">Conexão Fitness</Text>
        <Text className="text-gray-500 text-center max-w-[250px]">
          Seu marketplace para encontrar os melhores profissionais e academias.
        </Text>
      </View>
    </View>
  );
}
