import React, { useState } from "react";
import { View, TextInput, Button, Text, Image, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "@/constants/api";

export default function AddMusicScreen() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [mp3File, setMp3File] = useState<any>(null);
  const [thumbnail, setThumbnail] = useState<any>(null);

  const pickMp3 = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: "audio/mpeg" });
    if (!res.canceled) setMp3File(res.assets[0]);
  };

  const pickThumbnail = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!res.canceled) setThumbnail(res.assets[0]);
  };
  const uploadSong = async () => {
    if (!title || !artist || !mp3File) {
      Alert.alert("Missing Information", "Please fill all the required fields.");
      return;
    }
  
    const formData = new FormData();
    formData.append("action", "upload_music");
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append(
      "audio",
      mp3File ? {uri: mp3File.uri, name: mp3File.name, type: "audio/mpeg"} : null
    );
  
    if (thumbnail) {
      formData.append("thumbnail", {
        uri: thumbnail.uri,
        name: "thumb.jpg",
        type: "image/jpeg",
      });
    }
  
    console.log("FormData:", formData);  // Log FormData for debugging
  
    try {
      const res = await fetch(`${API_URL}/apimusicplayer/`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
  
      const data = await res.json();
      console.log(data);  // Log response for debugging
  
      if (data.resultCode === 200) {
        Alert.alert("Success", "Music uploaded successfully!");
      } else {
        Alert.alert("Error", data.resultMessage || "Something went wrong.");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Upload Failed", "There was an error uploading the song.");
    }
  };
  
  return (
    <View style={{ padding: 16, backgroundColor: "white" }}>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={{
          marginBottom: 10,
          padding: 10,
          borderWidth: 1,
          borderRadius: 5,
        }}
      />
      <TextInput
        placeholder="Artist"
        value={artist}
        onChangeText={setArtist}
        style={{
          marginBottom: 10,
          padding: 10,
          borderWidth: 1,
          borderRadius: 5,
        }}
      />

      <Button title="Pick MP3" onPress={pickMp3} />

      <Button title="Pick Thumbnail (optional)" onPress={pickThumbnail} />
      {thumbnail && (
        <Image
          source={{ uri: thumbnail.uri }}
          style={{ width: 100, height: 100, marginTop: 10 }}
        />
      )}

      <Button title="Upload Music" onPress={uploadSong} />

      {mp3File && <Text style={{ marginVertical: 5 }}>{mp3File.name}</Text>}
    </View>
  );
}
