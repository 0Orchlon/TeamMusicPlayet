import { API_URL } from "@/constants/api";
import Slider from "@react-native-community/slider";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";

const FavoriteMusicScreen = () => {
  const [favoriteSongs, setFavoriteSongs] = useState<any[]>([]);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingSong, setPlayingSong] = useState<any | null>(null);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(1); // avoid div by zero
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
    useCallback(() => {fetchFavorites(); }, []) );

  useEffect(() => {
    fetchFavorites();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handlePlaySong = async (item: any) => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsPlaying(false);
      setPositionMillis(0);
      setDurationMillis(1);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    const { sound } = await Audio.Sound.createAsync({
      uri: `${API_URL}/${item.audio}`,
    });

    soundRef.current = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;

      setPositionMillis(status.positionMillis);
      setDurationMillis(status.durationMillis ?? 1);

      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        // Song finished, reset
        closePlayer();
      }
    });

    setPlayingSong(item);
    await sound.playAsync();

    if (intervalRef.current) clearInterval(intervalRef.current);

  };

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
      } else {
        console.error("Failed to remove from favorites:", data.resultMessage);
      }
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  };

  const togglePlayback = async () => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const handleSeek = async (value: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(value);
      setPositionMillis(value);
    }
  };

  const closePlayer = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setPlayingSong(null);
    setIsPlaying(false);
    setPositionMillis(0);
    setDurationMillis(1);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.songItem}>
      <TouchableOpacity
        onPress={() => handlePlaySong(item)}
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
        onRequestClose={closePlayer}
      >
        <View style={styles.modalContainer}>
          <View style={styles.playerContainer}>
            <Image
              source={{ uri: `${API_URL}/${playingSong?.thumbnail}` }}
              style={styles.modalImage}
            />
            <Text style={styles.modalTitle}>{playingSong?.title}</Text>
            <Text style={styles.modalArtist}>{playingSong?.artist}</Text>

            {/* Slider */}
            {Platform.OS === "web" ? (
              <input
                type="range"
                value={positionMillis / 1000}
                min={0}
                max={durationMillis / 1000}
                step={1}
                onChange={async (e) => {
                  const newVal = Number(e.target.value);
                  setPositionMillis(newVal * 1000);
                  if (soundRef.current) {
                    await soundRef.current.setPositionAsync(newVal * 1000);
                  }
                }}
                style={{ width: "100%", marginVertical: 10 }}
              />
            ) : (
              <Slider
                style={{ width: 250, height: 40 }}
                minimumValue={0}
                maximumValue={durationMillis / 1000}
                value={positionMillis / 1000}
                onSlidingComplete={handleSeek}
                minimumTrackTintColor="#1EB1FC"
                maximumTrackTintColor="#ccc"
                thumbTintColor="#1EB1FC"
              />
            )}

            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(positionMillis)}</Text>
              <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
            </View>

            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={togglePlayback}
            >
              <Text style={styles.playPauseText}>
                {isPlaying ? "⏸ Pause" : "▶️ Play"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={closePlayer}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
    justifyContent: "space-between",
  },
  songContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  songArtist: {
    color: "#666",
  },
  songDuration: {
    fontSize: 12,
    color: "#aaa",
  },
  noSongsText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  playerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalArtist: {
    color: "#888",
    marginBottom: 20,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  timeText: {
    color: "#444",
    fontSize: 12,
  },
  playPauseButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 50,
    marginVertical: 10,
  },
  playPauseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeText: {
    color: "#1DB954",
    marginTop: 10,
  },
});
