import { StatusBar, StyleSheet, Text, View } from 'react-native';
import Application from './src/Application';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Application />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
