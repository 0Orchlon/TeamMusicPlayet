import React, { useState, useEffect } from "react";
import { View, Text, Button, FlatList } from "react-native";
import { API_URL } from "@/constants/api";

const MusicListScreen = () => {
  const [musicList, setMusicList] = useState<any[]>([]);

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const res = await fetch(`${API_URL}/apimusicplayer/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "get_my_music",
          }),
        });

        const data = await res.json();
        if (data.resultCode === 200) {
          setMusicList(data.data); // Assuming `data.data` contains the music list
        }
      } catch (error) {
        console.error("Failed to fetch music:", error);
      }
    };

    fetchMusic();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={{ padding: 10, borderBottomWidth: 1 }}>
      <Text style={{ fontWeight: "bold" }}>{item.title}</Text>
      <Text>{item.artist}</Text>
      <Text>{item.duration}</Text>
    </View>
  );

  return (
    <div style={{backgroundColor:"white"}}>
        <h1>The HomePage</h1>
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={musicList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        />
    </View>
        </div>
  );
};

export default MusicListScreen;
