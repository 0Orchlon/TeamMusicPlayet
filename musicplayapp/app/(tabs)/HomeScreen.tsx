import { API_URL } from "@/constants/api";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";

const MusicListScreen = () => {
  const [musicList, setMusicList] = useState<any[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<any | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(1); // avoid div by zero
  const [value, setValue] = useState(0);
  const min = 0;
  const max = 100;
  const step = 1;


  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const res = await fetch(`${API_URL}/apimusicplayer/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_my_music" }),
        });
        const data = await res.json();
        if (data.resultCode === 200) {
          setMusicList(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch music:", error);
      }
    };

    fetchMusic();

    return () => {
      // Clean up sound when component unmounts
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playSound = async (audioUrl: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: `${API_URL}/${audioUrl}` },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(true);
      setDurationMillis(status.durationMillis || 1);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };
  const togglePlayback = async () => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (status.isLoaded) {
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  };
  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleSongPress = async (item: any) => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
    }
    setSelectedMusic(item);
    setModalVisible(true);
    playSound(item.audio);
  };

  const closeModal = async () => {
    setModalVisible(false);
    if (soundRef.current) {
      await soundRef.current.stopAsync();
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleSongPress(item)}
      style={styles.songItem}
    >
      <Image
        source={{ uri: `${API_URL}/${item.thumbnail}` }}
        style={styles.thumbnail}
      />
      <View>
        <Text style={{ fontWeight: "bold" }}>{item.title}</Text>
        <Text>{item.artist}</Text>
        <Text>{item.duration}</Text>
      </View>
    </TouchableOpacity>
  );
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPositionMillis(status.positionMillis);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPositionMillis(0);
      }
    } else if (status.error) {
      console.error("Playback error:", status.error);
    }
  };
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

      {/* Modal for Playing Song */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={closeModal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriver
      >
        <View style={styles.modalContent}>
          {selectedMusic && (
            <>
              <Image
                source={{ uri: `${API_URL}/${selectedMusic.thumbnail}` }}
                style={styles.modalThumbnail}
              />
              <Text style={styles.modalTitle}>{selectedMusic.title}</Text>
              <Text style={styles.modalArtist}>{selectedMusic.artist}</Text>

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
    onSlidingComplete={async (value) => {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(value * 1000);
      }
    }}
    minimumTrackTintColor="#1EB1FC"
    maximumTrackTintColor="#ccc"
    thumbTintColor="#1EB1FC"
  />
)}

              <Text>
                {formatTime(positionMillis)} / {formatTime(durationMillis)}
              </Text>

              {/* Play/Pause */}
              <TouchableOpacity
                onPress={togglePlayback}
                style={[
                  styles.closeButton,
                  { marginTop: 16, marginBottom: 10 },
                ]}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {isPlaying ? "Pause" : "Play"}
                </Text>
              </TouchableOpacity>

              {/* Close */}
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Close
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
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
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    alignItems: "center",
    borderRadius: 12,
  },
  modalThumbnail: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalArtist: {
    fontSize: 16,
    color: "gray",
    marginBottom: 4,
  },
  modalDuration: {
    fontSize: 14,
    color: "gray",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
});

export default MusicListScreen;
