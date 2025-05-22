import MusicPlayer from "@/components/MusicPlayer";
import { API_URL } from "@/constants/api";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

const MusicListScreen = () => {
  const [musicList, setMusicList] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<{ [key: number]: boolean }>({});
  const [selectedMusic, setSelectedMusic] = useState<any | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  const fetchMusicAndFavorites = async () => {
    try {
      const resMusic = await fetch(`${API_URL}/apimusicplayer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_my_music" }),
      });
      const dataMusic = await resMusic.json();

      if (dataMusic.resultCode === 200) {
        setMusicList(dataMusic.data);

        const resFaves = await fetch(`${API_URL}/apimusicplayer/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_fave" }),
        });
        const dataFaves = await resFaves.json();

        const favMap: { [key: number]: boolean } = {};
        if (dataFaves.resultCode === 200 && Array.isArray(dataFaves.data)) {
          dataFaves.data.forEach((favItem: any) => {
            const id = favItem.song_id ?? favItem.id;
            if (id != null) {
              favMap[id] = true;
            }
          });
        }
        setFavorites(favMap);
      }
    } catch (error) {
      console.error("Failed to fetch music or favorites:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMusicAndFavorites();
    }, [])
  );

  const toggleFavorite = async (musicId: number) => {
    const isFav = favorites[musicId];
    setFavorites((prev) => ({ ...prev, [musicId]: !isFav }));

    try {
      await fetch(`${API_URL}/apimusicplayer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isFav ? "remove_fave" : "add_fave",
          song_id: musicId,
        }),
      });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      setFavorites((prev) => ({ ...prev, [musicId]: isFav }));
    }
  };

  const handleSongPress = (item: any) => {
    setSelectedMusic(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMusic(null);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => handleSongPress(item)} style={styles.songItem}>
      <Image source={{ uri: `${API_URL}/${item.thumbnail}` }} style={styles.thumbnail} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "bold" }}>{item.title}</Text>
        <Text>{item.artist}</Text>
        <Text>{item.duration}</Text>
      </View>
      <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
        <Icon
          name={favorites[item.id] ? "star" : "star-o"}
          size={24}
          color={favorites[item.id] ? "gold" : "gray"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "white", padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
        My Music
      </Text>
      <FlatList
        data={musicList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />

      <MusicPlayer
        selectedMusic={selectedMusic}
        isVisible={isModalVisible}
        onClose={closeModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  songItem: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 6,
  },
});

export default MusicListScreen;
