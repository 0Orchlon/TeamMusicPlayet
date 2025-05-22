import { API_URL } from "@/constants/api";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const AlbumsScreen = () => {
  const [albums, setAlbums] = useState<any[]>([]);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [loading, setLoading] = useState(false);

  // Songs state
  const [songs, setSongs] = useState<any[]>([]);
  // Modal visibility
  const [modalVisible, setModalVisible] = useState(false);
  // Album selected to add songs
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);
  // Songs selected to add
  const [selectedSongs, setSelectedSongs] = useState<Set<number>>(new Set());

  // To keep track of album songs for duplicate check
  // You might need to fetch songs per album or you can have the backend provide this info
  const [albumSongsMap, setAlbumSongsMap] = useState<Record<number, number[]>>({});

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

        // Optional: fetch songs for each album here or have backend send it with album data
        // For demo, assume each album has 'songs' field with list of song ids
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
        fetchAlbums(); // Refresh album list
      } else {
        Alert.alert("Failed to add album", data.resultMessage || "Unknown error");
      }
    } catch (error) {
      console.error("Error adding album:", error);
      Alert.alert("Error", "Failed to add album");
    } finally {
      setLoading(false);
    }
  };

  const addSongToAlbum = async (song_id: number, album_id: number) => {
    try {
      const res = await fetch(`${API_URL}/apimusicplayer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_to_album",
          song_id: song_id,
          album_id: album_id,
        }),
      });
      console.log(res)
      const data = await res.json();

      if (data.resultCode === 200) {
        Alert.alert("Success", "Song added to album!");
        // Update albumSongsMap so the song shows as added
        setAlbumSongsMap((prev) => {
          const newSongs = prev[album_id] ? [...prev[album_id], song_id] : [song_id];
          return { ...prev, [album_id]: newSongs };
        });
      } else {
        Alert.alert("Failed to add song", data.resultMessage || "Unknown error");
      }
    } catch (error) {
      console.error("Error adding song to album:", error);
      Alert.alert("Error", "Failed to add song to album");
    }
  };

  // Open modal for selecting songs to add to an album
  const openAddSongsModal = (album: any) => {
    setSelectedAlbum(album);
    setSelectedSongs(new Set()); // clear selected songs
    fetchSongs();
    setModalVisible(true);
  };

  // Toggle song selection
  const toggleSelectSong = (songId: number) => {
    setSelectedSongs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) newSet.delete(songId);
      else newSet.add(songId);
      return newSet;
    });
  };

  // Add selected songs to album, checking duplicates
  const addSelectedSongs = async () => {
    if (!selectedAlbum) return;
    const albumId = selectedAlbum.id;
    const existingSongs = albumSongsMap[albumId] || [];

    const songsToAdd = Array.from(selectedSongs).filter((songId) => !existingSongs.includes(songId));

    if (songsToAdd.length === 0) {
      Alert.alert("Info", "Selected songs are already in the album");
      return;
    }

    setLoading(true);
    try {
      for (const songId of songsToAdd) {
        // Await each add call to avoid flooding server (optional: parallelize if backend supports)
        // eslint-disable-next-line no-await-in-loop
        await addSongToAlbum(songId, albumId);
      }
      Alert.alert("Success", "Selected songs added to album!");
      setModalVisible(false);
      fetchAlbums(); // Refresh albums and songs inside if necessary
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

  const renderAlbumItem = ({ item }: any) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
      }}
      onPress={() => console.log("View album:", item.name)}
    >
      <Image
        source={{ uri: item.thumbnail || "default-thumbnail-url.jpg" }}
        style={{ width: 50, height: 50, marginRight: 10 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "bold" }}>{item.name}</Text>
        <Text>{item.artist}</Text>
        <Button title="Add Music" onPress={() => openAddSongsModal(item)} />
      </View>
    </TouchableOpacity>
  );

  const renderSongItem = ({ item }: any) => {
    const isSelected = selectedSongs.has(item.id);
    // Check if song is already in album
    const alreadyInAlbum = selectedAlbum ? albumSongsMap[selectedAlbum.id]?.includes(item.id) : false;

    return (
      <TouchableOpacity
        style={{
          flexDirection: "row",
          padding: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#ccc",
          backgroundColor: alreadyInAlbum ? "#ddd" : isSelected ? "#aaf" : "white",
        }}
        disabled={alreadyInAlbum}
        onPress={() => toggleSelectSong(item.id)}
      >
        <Text style={{ flex: 1 }}>{item.title} - {item.artist}</Text>
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

      {/* Add Album Form */}
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
        <Button title={loading ? "Saving..." : "Add Album"} onPress={addAlbum} disabled={loading} />
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

      {/* Modal to select songs */}
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
            <Button title="Add Selected Songs" onPress={addSelectedSongs} disabled={loading || selectedSongs.size === 0} />
            <View style={{ height: 10 }} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default AlbumsScreen;
