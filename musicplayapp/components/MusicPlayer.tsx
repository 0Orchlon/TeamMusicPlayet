import { API_URL } from "@/constants/api";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Modal from "react-native-modal";

interface MusicPlayerProps {
  selectedMusic: any | null;
  isVisible: boolean;
  onClose: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  selectedMusic,
  isVisible,
  onClose,
}) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(1);

  useEffect(() => {
    if (selectedMusic && isVisible) {
      playSound(selectedMusic.audio);
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [selectedMusic, isVisible]);

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

  const onSliderValueChange = async (value: number) => {
    setPositionMillis(value * 1000);
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(value * 1000);
    }
  };

  if (!selectedMusic) return null;

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      useNativeDriver
    >
      <View style={styles.modalContent}>
        <Image
          source={{ uri: `${API_URL}/${selectedMusic.thumbnail}` }}
          style={styles.modalThumbnail}
        />
        <Text style={styles.modalTitle}>{selectedMusic.title}</Text>
        <Text style={styles.modalArtist}>{selectedMusic.artist}</Text>

        {Platform.OS === "web" ? (
          <input
            type="range"
            value={positionMillis / 1000}
            min={0}
            max={durationMillis / 1000}
            step={1}
            onChange={async (e) => {
              const newVal = Number(e.target.value);
              await onSliderValueChange(newVal);
            }}
            style={{ width: "100%", marginVertical: 10 }}
          />
        ) : (
          <Slider
            style={{ width: 250, height: 40 }}
            minimumValue={0}
            maximumValue={durationMillis / 1000}
            value={positionMillis / 1000}
            onSlidingComplete={onSliderValueChange}
            minimumTrackTintColor="#1EB1FC"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#1EB1FC"
          />
        )}

        <Text>
          {formatTime(positionMillis)} / {formatTime(durationMillis)}
        </Text>

        <TouchableOpacity
          onPress={togglePlayback}
          style={[styles.closeButton, { marginTop: 16, marginBottom: 10 }]}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            {isPlaying ? "Pause" : "Play"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={{ color: "white", fontWeight: "bold" }}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  closeButton: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
});

export default MusicPlayer;
