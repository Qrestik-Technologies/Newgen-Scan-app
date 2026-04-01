import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ScanScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant gallery access to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const takePhoto = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Please grant camera access to take photos.');
        return;
      }
    }
    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        if (photo.base64) {
          setImage(`data:image/jpeg;base64,${photo.base64}`);
          setShowCamera(false);
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      }
    }
  };

  const processImage = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please select or capture an image first.');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(`${API_URL}/api/scan/base64`, {
        image_base64: image,
      });

      router.push({
        pathname: '/review',
        params: {
          rawText: response.data.raw_text,
          structuredData: JSON.stringify(response.data.structured_data),
          confidence: response.data.confidence.toString(),
          imageBase64: image,
          extractionMode: response.data.extraction_mode ?? '',
        },
      });
    } catch (error: any) {
      console.error('Scan error:', error);
      Alert.alert(
        'Scan Failed',
        error.response?.data?.detail || 'Failed to process image. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraFrame} />
          </View>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraCloseButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={capturePhoto}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <View style={{ width: 60 }} />
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={24} color="#1a5f7a" />
          <View style={styles.instructionsTextCol}>
            <Text style={styles.instructionsText}>
              Scan and extract reads your appointment register photo. On save, each row
              becomes a patient profile with:
            </Text>
            <Text style={styles.instructionsBullets}>
              • Patient name{'\n'}• Mobile number{'\n'}• Doctor{'\n'}• Age and male / female
              (from AGE/SEX){'\n'}• Comments (remarks; time and sheet number go in profile notes)
            </Text>
          </View>
        </View>

        {/* Image Preview */}
        <View style={styles.previewContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="document-text-outline" size={80} color="#ccc" />
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cameraButton]}
            onPress={takePhoto}
            disabled={processing}
          >
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.galleryButton]}
            onPress={pickImage}
            disabled={processing}
          >
            <Ionicons name="images" size={24} color="#fff" />
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Process Button */}
        {image && (
          <TouchableOpacity
            style={[styles.processButton, processing && styles.disabledButton]}
            onPress={processImage}
            disabled={processing}
          >
            {processing ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.processButtonText}>Processing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="scan" size={24} color="#fff" />
                <Text style={styles.processButtonText}>Scan & Extract</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Clear Button */}
        {image && !processing && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setImage(null)}
          >
            <Text style={styles.clearButtonText}>Clear Image</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: '#e8f4f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  instructionsTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  instructionsBullets: {
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  preview: {
    width: '100%',
    height: 300,
  },
  placeholderContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: '#1a5f7a',
  },
  galleryButton: {
    backgroundColor: '#6ab04c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  processButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  clearButton: {
    alignItems: 'center',
    padding: 12,
    marginTop: 12,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFrame: {
    width: '80%',
    aspectRatio: 0.7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cameraCloseButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
});
