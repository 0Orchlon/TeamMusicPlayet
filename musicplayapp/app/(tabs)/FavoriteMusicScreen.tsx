import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { API_URL } from "@/constants/api"; // Assuming the API URL is stored in constants

const FavoriteMusicScreen = () => {
  const [favoriteSongs, setFavoriteSongs] = useState<any[]>([]);

  // Fetch favorite songs from the backend
  const fetchFavoriteSongs = async () => {
    try {
      const response = await fetch(`${API_URL}/apimusicplayer`, {
        method: "GET",
      });
      const data = await response.json();

      if (data.resultCode === 200) {
        setFavoriteSongs(data.data); // Assuming data.data contains the list of favorite songs
      } else {
        console.error("Failed to fetch favorite songs:", data.resultMessage);
      }
    } catch (error) {
      console.error("Error fetching favorite songs:", error);
    }
  };

  useEffect(() => {
    fetchFavoriteSongs();
  }, []); // Empty array means this effect runs once when the component mounts

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
      }}
      onPress={() => console.log("Play song:", item.title)} // Replace with play logic
    >
      <Image
        source={{ uri: item.thumbnail || "default-thumbnail-url.jpg" }} // Replace with a default thumbnail if necessary
        style={{ width: 50, height: 50, marginRight: 10 }}
      />
      <View>
        <Text style={{ fontWeight: "bold" }}>{item.title}</Text>
        <Text>{item.artist}</Text>
        <Text>{item.duration}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <div style={{backgroundColor:"white"}}>

    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Favorite Music
      </Text>
      {favoriteSongs.length > 0 ? (
        <FlatList
          data={favoriteSongs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      ) : (
          <Text>No favorite songs yet!</Text>
        )}
    </View>
        </div>
  );
};

export default FavoriteMusicScreen;
