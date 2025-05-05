import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { useState } from 'react';

export default function SongItem({ song }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const playSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: song.audio },
      { shouldPlay: true }
    );
    setSound(newSound);
  };

  return (
    <TouchableOpacity onPress={playSound} style={{ flexDirection: 'row', padding: 10 }}>
      {song.thumbnail && (
        <Image source={{ uri: song.thumbnail }} style={{ width: 50, height: 50, marginRight: 10 }} />
      )}
      <View>
        <Text style={{ fontWeight: 'bold' }}>{song.title}</Text>
        <Text>{song.artist}</Text>
      </View>
    </TouchableOpacity>
  );
}
