import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function NewPatientScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    doctor_name: '',
    notes: '',
    location: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const dismissSuccessAndGoToList = () => {
    setSuccessVisible(false);
    router.replace('/patients');
  };

  const formLocked = submitting || successVisible;

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Patient name is required.');
      return;
    }

    if (submitting || successVisible) {
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/patients`, {
        name: formData.name,
        age: parseInt(formData.age) || 0,
        gender: formData.gender,
        phone: formData.phone,
        doctor_name: formData.doctor_name.trim(),
        notes: formData.notes.trim(),
        location: formData.location.trim() || undefined,
      });
      setSuccessVisible(true);
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert(
        'Save Failed',
        error.response?.data?.detail || 'Failed to create patient. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const genderOptions = ['Male', 'Female', 'Other'];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
        onRequestClose={dismissSuccessAndGoToList}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="checkmark-circle" size={48} color="#27ae60" />
            </View>
            <Text style={styles.modalTitle}>Success</Text>
            <Text style={styles.modalMessage}>Patient created successfully!</Text>
            <Pressable
              style={({ pressed }) => [styles.modalOk, pressed && styles.modalOkPressed]}
              onPress={dismissSuccessAndGoToList}
            >
              <Text style={styles.modalOkText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(v) => updateField('name', v)}
              placeholder="Enter patient name"
              placeholderTextColor="#999"
              autoFocus
              editable={!formLocked}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(v) => updateField('age', v)}
              placeholder="Enter age"
              keyboardType="numeric"
              placeholderTextColor="#999"
              editable={!formLocked}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.genderOption,
                    formData.gender === option && styles.genderOptionSelected,
                  ]}
                  onPress={() => updateField('gender', option)}
                  disabled={formLocked}
                >
                  <Ionicons
                    name={option === 'Female' ? 'female' : option === 'Male' ? 'male' : 'person'}
                    size={20}
                    color={formData.gender === option ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.genderOptionText,
                      formData.gender === option && styles.genderOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(v) => updateField('phone', v)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              placeholderTextColor="#999"
              editable={!formLocked}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Doctor</Text>
            <TextInput
              style={styles.input}
              value={formData.doctor_name}
              onChangeText={(v) => updateField('doctor_name', v)}
              placeholder="e.g. Dr. Hemalatha"
              placeholderTextColor="#999"
              editable={!formLocked}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Comments / notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(v) => updateField('notes', v)}
              placeholder="Remarks, follow-up instructions, etc."
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
              editable={!formLocked}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(v) => updateField('location', v)}
              placeholder="City, clinic branch, or address"
              placeholderTextColor="#999"
              editable={!formLocked}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, formLocked && styles.disabledButton]}
          onPress={handleSave}
          disabled={formLocked}
        >
          {submitting ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </>
          ) : (
            <>
              <Ionicons name="person-add" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>Create Patient</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={formLocked}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  genderOptionSelected: {
    backgroundColor: '#1a5f7a',
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 12,
    gap: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconWrap: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalOk: {
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  modalOkPressed: {
    opacity: 0.85,
  },
  modalOkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
