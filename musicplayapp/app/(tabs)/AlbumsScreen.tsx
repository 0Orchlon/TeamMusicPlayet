import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { API_URL } from "@/constants/api"; // Assuming the API URL is stored in constants

const AlbumsScreen = () => {
  const [albums, setAlbums] = useState<any[]>([]);

  // Fetch albums from the backend
  const fetchAlbums = async () => {
    try {
      const response = await fetch(`${API_URL}/?action=get_albums`, {
        method: "GET",
      });
      const data = await response.json();

      if (data.resultCode === 200) {
        setAlbums(data.data); // Assuming data.data contains the list of albums
      } else {
        console.error("Failed to fetch albums:", data.resultMessage);
      }
    } catch (error) {
      console.error("Error fetching albums:", error);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []); // Empty array means this effect runs once when the component mounts

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
      }}
      onPress={() => console.log("View album:", item.name)} // Replace with album details page navigation
    >
      <Image
        source={{ uri: item.thumbnail || "default-thumbnail-url.jpg" }} // Replace with a default thumbnail if necessary
        style={{ width: 50, height: 50, marginRight: 10 }}
      />
      <View>
        <Text style={{ fontWeight: "bold" }}>{item.name}</Text>
        <Text>{item.artist}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <div style={{backgroundColor:"white"}}>

    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Albums
      </Text>
      {albums.length > 0 ? (
        <FlatList
          data={albums}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      ) : (
        <Text>No albums found!</Text>
      )}
    </View>
    </div>
  );
};

export default AlbumsScreen;
