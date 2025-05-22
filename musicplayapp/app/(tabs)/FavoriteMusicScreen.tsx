import MusicPlayer from "@/components/MusicPlayer"; // adjust the path as needed
import { API_URL } from "@/constants/api";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

const FavoriteMusicScreen = () => {
  const [favoriteSongs, setFavoriteSongs] = useState<any[]>([]);
  const [playingSong, setPlayingSong] = useState<any | null>(null);

  const fetchFavorites = async () => {
    try {
      const res = await fetch(`${API_URL}/apimusicplayer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_fave" }),
      });
      const data = await res.json();
      if (data.resultCode === 200) {
        setFavoriteSongs(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );
  useEffect(() => {
    fetchFavorites();
  }, []);

  const removeFromFavorites = async (songId: number) => {
    try {
      const res = await fetch(`${API_URL}/apimusicplayer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_fave",
          song_id: songId,
        }),
      });
      const data = await res.json();
      if (data.resultCode === 200) {
        setFavoriteSongs((prev) => prev.filter((song) => song.id !== songId));
        if (playingSong?.id === songId) {
          setPlayingSong(null); // close player if current song removed
        }
      } else {
        console.error("Failed to remove from favorites:", data.resultMessage);
      }
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.songItem}>
      <TouchableOpacity
        onPress={() => setPlayingSong(item)}
        style={styles.songContent}
      >
        <Image
          source={{ uri: `${API_URL}/${item.thumbnail}` }}
          style={styles.thumbnail}
        />
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>{item.title}</Text>
          <Text style={styles.songArtist}>{item.artist}</Text>
          <Text style={styles.songDuration}>{item.duration}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => removeFromFavorites(item.id)}>
        <Icon name="star" size={24} color="#FFD700" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Favorite Music</Text>
      {favoriteSongs.length > 0 ? (
        <FlatList
          data={favoriteSongs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      ) : (
        <Text style={styles.noSongsText}>No favorite songs yet!</Text>
      )}

      <Modal
        visible={!!playingSong}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPlayingSong(null)}
      >
        <MusicPlayer
          selectedMusic={playingSong} // renamed from 'song'
          isVisible={!!playingSong} // add visibility prop
          onClose={() => setPlayingSong(null)}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default FavoriteMusicScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: { fontSize: 26, fontWeight: "bold", marginBottom: 16 },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
    justifyContent: "space-between",
  },
  songContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  thumbnail: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 16, fontWeight: "600" },
  songArtist: { color: "#666" },
  songDuration: { fontSize: 12, color: "#aaa" },
  noSongsText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
    fontSize: 16,
  },
});
