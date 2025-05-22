import MusicPlayer from "@/components/MusicPlayer";
import { API_URL } from "@/constants/api";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const AlbumsScreen = () => {
  const [albums, setAlbums] = useState<any[]>([]);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [loading, setLoading] = useState(false);

  const [songs, setSongs] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<Set<number>>(new Set());
  const [albumSongsMap, setAlbumSongsMap] = useState<Record<number, number[]>>(
    {}
  );
  const [albumSongsVisible, setAlbumSongsVisible] = useState(false);
  const [albumSongsList, setAlbumSongsList] = useState<any[]>([]);
  const [albumSongsTitle, setAlbumSongsTitle] = useState("");
const [selectedMusic, setSelectedMusic] = useState(null);
const [isPlayerVisible, setIsPlayerVisible] = useState(false);

const handlePlayMusic = (item: any) => {
  setSelectedMusic(item);
  setIsPlayerVisible(true);
};

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/apimusicplayer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_all_album" }),
      });
      const data = await res.json();

      if (data.resultCode === 200) {
        setAlbums(data.data || []);
        let map: Record<number, number[]> = {};
        (data.data || []).forEach((album: any) => {
          map[album.id] = album.songs || [];
        });
        setAlbumSongsMap(map);
      } else {
        console.error("Failed to fetch albums:", data.resultMessage);
      }
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/apimusicplayer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_my_music" }),
      });
      const data = await res.json();

      if (data.resultCode === 200) {
        setSongs(data.data || []);
      } else {
        console.error("Failed to fetch songs:", data.resultMessage);
      }
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const addAlbum = async () => {
    if (!newAlbumName.trim()) {
      Alert.alert("Error", "Please enter album name");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/apimusicplayer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_album",
          name: newAlbumName.trim(),
        }),
      });
      const data = await res.json();

      if (data.resultCode === 200) {
        Alert.alert("Success", "Album added!");
        setNewAlbumName("");
        fetchAlbums();
      } else {
        Alert.alert(
          "Failed to add album",
          data.resultMessage || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error adding album:", error);
      Alert.alert("Error", "Failed to add album");
    } finally {
      setLoading(false);
    }
  };
const handleRemoveFromAlbum = async (songId: number, albumId: number) => {
  try {
    const response = await fetch(`${API_URL}/apimusicplayer/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remove_from_album",
        song_id: songId,
        album_id: albumId,
      }),
    });

    const result = await response.json();
    if (result.resultCode === 200) {
      setAlbumSongsList(prev => prev.filter(item => item.song_id !== songId));
    } else {
      alert("Failed to remove song");
    }
  } catch (err) {
    console.error(err);
  }
};

  const addSongToAlbum = async (song_id: number, album_id: number) => {
    try {
      const res = await fetch(`${API_URL}/apimusicplayer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_to_album",
          song_id,
          album_id,
        }),
      });
      const data = await res.json();

      if (data.resultCode === 200) {
        setAlbumSongsMap((prev) => {
          const newSongs = prev[album_id]
            ? [...prev[album_id], song_id]
            : [song_id];
          return { ...prev, [album_id]: newSongs };
        });
      } else {
        Alert.alert(
          "Failed to add song",
          data.resultMessage || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error adding song to album:", error);
      Alert.alert("Error", "Failed to add song to album");
    }
  };

  const openAddSongsModal = (album: any) => {
    setSelectedAlbum(album);
    setSelectedSongs(new Set());
    fetchSongs();
    setModalVisible(true);
  };

  const toggleSelectSong = (songId: number) => {
    setSelectedSongs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) newSet.delete(songId);
      else newSet.add(songId);
      return newSet;
    });
  };

  const addSelectedSongs = async () => {
    if (!selectedAlbum) return;
    const albumId = selectedAlbum.id;
    const existingSongs = albumSongsMap[albumId] || [];
    const songsToAdd = Array.from(selectedSongs).filter(
      (songId) => !existingSongs.includes(songId)
    );

    if (songsToAdd.length === 0) {
      Alert.alert("Info", "Selected songs are already in the album");
      return;
    }

    setLoading(true);
    try {
      for (const songId of songsToAdd) {
        await addSongToAlbum(songId, albumId);
      }
      Alert.alert("Success", "Selected songs added to album!");
      setModalVisible(false);
      fetchAlbums();
    } catch (error) {
      console.error("Error adding selected songs:", error);
      Alert.alert("Error", "Failed to add some songs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);
  const openAlbumSongsModal = async (album: any) => {
    try {
      const response = await fetch(`${API_URL}/apimusicplayer/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_album_music",
          id: album.id,
        }),
      });

      const json = await response.json();

      if (json.resultCode === 200) {
        setAlbumSongsList(json.data);
        setAlbumSongsTitle(album.name);
        setAlbumSongsVisible(true);
      } else {
        Alert.alert("Error", json.resultMessage || "Failed to load songs");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Network Error", "Unable to load album songs.");
    }
  };

  const renderAlbumItem = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => openAlbumSongsModal(item)}
      style={{
        flexDirection: "row",
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "bold" }}>{item.name}</Text>
        <Text>{item.artist}</Text>
        <Button title="Add Music" onPress={() => openAddSongsModal(item)} />
      </View>
    </TouchableOpacity>
  );

  const renderSongItem = ({ item }: any) => {
    const isSelected = selectedSongs.has(item.id);
    const alreadyInAlbum = selectedAlbum
      ? albumSongsMap[selectedAlbum.id]?.includes(item.id)
      : false;

    return (
      <TouchableOpacity
        style={{
          flexDirection: "row",
          padding: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#ccc",
          backgroundColor: alreadyInAlbum
            ? "#ddd"
            : isSelected
            ? "#aaf"
            : "white",
        }}
        disabled={alreadyInAlbum}
        onPress={() => toggleSelectSong(item.id)}
      >
        <Text style={{ flex: 1 }}>
          {item.title} - {item.artist}
        </Text>
        {alreadyInAlbum && <Text style={{ color: "green" }}>Added</Text>}
        {!alreadyInAlbum && isSelected && <Text>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white", padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Albums
      </Text>

      <View style={{ marginBottom: 20 }}>
        <TextInput
          placeholder="Album Name"
          value={newAlbumName}
          onChangeText={setNewAlbumName}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 8,
            marginBottom: 10,
            borderRadius: 4,
          }}
        />
        <Button
          title={loading ? "Saving..." : "Add Album"}
          onPress={addAlbum}
          disabled={loading}
        />
      </View>

      {albums.length > 0 ? (
        <FlatList
          data={albums}
          renderItem={renderAlbumItem}
          keyExtractor={(item) => item.id.toString()}
          refreshing={loading}
          onRefresh={fetchAlbums}
        />
      ) : loading ? (
        <Text>Loading albums...</Text>
      ) : (
        <Text>No albums found!</Text>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
            Select Songs to Add to "{selectedAlbum?.name}"
          </Text>
          <FlatList
            data={songs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSongItem}
            extraData={selectedSongs}
            ListEmptyComponent={<Text>No songs found</Text>}
          />

          <View style={{ marginTop: 20 }}>
            <Button
              title="Add Selected Songs"
              onPress={addSelectedSongs}
              disabled={loading || selectedSongs.size === 0}
            />
            <View style={{ height: 10 }} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
          </View>
        </SafeAreaView>
      </Modal>
      <Modal
        visible={albumSongsVisible}
        animationType="slide"
        onRequestClose={() => setAlbumSongsVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
            Songs in "{albumSongsTitle}"
          </Text>

          {albumSongsList.length > 0 ? (
            <FlatList
              data={albumSongsList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
  <View
    style={{
      flexDirection: "row",
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#ccc",
      alignItems: "center",
    }}
  >
    <Image
      source={{ uri: `${API_URL}/${item.thumbnail}` }}
      style={styles.thumbnail}
    />
    <View style={{ flex: 1, marginLeft: 10 }}>
      <Text style={{ fontWeight: "bold" }}>{item.title}</Text>
      <Text>{item.artist ?? "Unknown artist"}</Text>
      <Text>{item.duration}</Text>
       <View style={{ flexDirection: "row", marginTop: 5 }}>
        <TouchableOpacity
          onPress={() => handlePlayMusic(item)}
          style={{
            padding: 6,
            backgroundColor: "#1EB1FC",
            borderRadius: 6,
            marginRight: 8,
          }}
        >
          <Text style={{ color: "white" }}>Play</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleRemoveFromAlbum(item.song_id, item.album_id)}
          style={{
            padding: 6,
            backgroundColor: "#ff4d4d",
            borderRadius: 6,
          }}
        >
          <Text style={{ color: "white" }}>Remove</Text>
        </TouchableOpacity>
        </View>
                  </View>
                </View>
              )}
            />
          ) : (
            <Text>No songs in this album.</Text>
          )}

          <View style={{ marginTop: 20 }}>
            <Button title="Close" onPress={() => setAlbumSongsVisible(false)} />
          </View>
        </SafeAreaView>
      </Modal>

      <MusicPlayer
  selectedMusic={selectedMusic}
  isVisible={isPlayerVisible}
  onClose={() => setIsPlayerVisible(false)}
/>
    </SafeAreaView>
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
export default AlbumsScreen;
