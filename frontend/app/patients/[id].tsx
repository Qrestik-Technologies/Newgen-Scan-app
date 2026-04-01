import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  doctor_name?: string;
  notes?: string;
  location?: string;
  created_at: string;
}

interface Visit {
  id: string;
  patient_id: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  has_image?: boolean;
  created_at: string;
}

export default function PatientDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const patientId = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchData = async () => {
    if (!API_URL || !patientId) return;
    try {
      const [patientRes, visitsRes] = await Promise.all([
        axios.get(`${API_URL}/api/patients/${patientId}`),
        axios.get(`${API_URL}/api/visits`, { params: { patient_id: patientId } }),
      ]);
      setPatient(patientRes.data);
      setVisits(visitsRes.data);
    } catch (error) {
      console.error('Error fetching patient:', error);
      Alert.alert('Error', 'Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [patientId])
  );

  const executeDeletePatient = async () => {
    if (!API_URL || !patientId) return;
    setDeleteBusy(true);
    try {
      await axios.delete(
        `${API_URL}/api/patients/${encodeURIComponent(patientId)}`
      );
      setDeleteModalVisible(false);
      router.replace('/patients');
    } catch (error: any) {
      console.error('Delete error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || error.message || 'Failed to delete patient.'
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5f7a" />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Patient not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !deleteBusy && setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalBackdrop}>
          <View style={styles.deleteModalCard}>
            <Text style={styles.deleteModalTitle}>Delete patient</Text>
            <Text style={styles.deleteModalBody}>
              Remove {patient?.name ?? 'this patient'}? All visits will be deleted too.
            </Text>
            <View style={styles.deleteModalActions}>
              <Pressable
                style={[styles.deleteModalBtn, styles.deleteModalBtnCancel]}
                onPress={() => !deleteBusy && setDeleteModalVisible(false)}
                disabled={deleteBusy}
              >
                <Text style={styles.deleteModalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.deleteModalBtn, styles.deleteModalBtnDanger]}
                onPress={executeDeletePatient}
                disabled={deleteBusy}
              >
                {deleteBusy ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteModalBtnDangerText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Patient Card */}
      <View style={styles.patientCard}>
        <View style={styles.avatarContainer}>
          <Ionicons
            name={
              patient.gender.toLowerCase() === 'female'
                ? 'female'
                : patient.gender.toLowerCase() === 'male'
                  ? 'male'
                  : 'person'
            }
            size={48}
            color="#1a5f7a"
          />
        </View>
        <Text style={styles.patientName}>{patient.name}</Text>
        <View style={styles.patientMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.metaText}>{patient.age} years</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="person" size={16} color="#666" />
            <Text style={styles.metaText}>{patient.gender}</Text>
          </View>
          {patient.phone && (
            <View style={styles.metaItem}>
              <Ionicons name="call" size={16} color="#666" />
              <Text style={styles.metaText}>{patient.phone}</Text>
            </View>
          )}
          {patient.doctor_name ? (
            <View style={styles.metaItem}>
              <Ionicons name="medkit-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{patient.doctor_name}</Text>
            </View>
          ) : null}
          {patient.location ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{patient.location}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.createdAt}>Added: {formatDate(patient.created_at)}</Text>
      </View>

      {patient.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Comments and notes</Text>
          <Text style={styles.notesBody}>{patient.notes}</Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.scanButton]}
          onPress={() => router.push('/scan')}
        >
          <Ionicons name="scan" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>New Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => setDeleteModalVisible(true)}
        >
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Visits Section */}
      <View style={styles.visitsSection}>
        <View style={styles.visitsSectionHeader}>
          <Text style={styles.visitsSectionTitle}>Visit History</Text>
          <Text style={styles.visitsCount}>{visits.length} visits</Text>
        </View>

        {visits.length === 0 ? (
          <View style={styles.emptyVisits}>
            <Ionicons name="clipboard-outline" size={48} color="#ccc" />
            <Text style={styles.emptyVisitsText}>No visits recorded yet</Text>
          </View>
        ) : (
          visits.map((visit) => (
            <TouchableOpacity
              key={visit.id}
              style={styles.visitCard}
              onPress={() => router.push(`/visits/${visit.id}`)}
            >
              <View style={styles.visitHeader}>
                <Ionicons name="document-text" size={20} color="#1a5f7a" />
                <Text style={styles.visitDate}>{formatDate(visit.created_at)}</Text>
              </View>
              <View style={styles.visitContent}>
                <View style={styles.visitField}>
                  <Text style={styles.visitLabel}>Symptoms:</Text>
                  <Text style={styles.visitValue} numberOfLines={2}>
                    {visit.symptoms || 'Not recorded'}
                  </Text>
                </View>
                <View style={styles.visitField}>
                  <Text style={styles.visitLabel}>Diagnosis:</Text>
                  <Text style={styles.visitValue} numberOfLines={1}>
                    {visit.diagnosis || 'Not recorded'}
                  </Text>
                </View>
              </View>
              <View style={styles.visitFooter}>
                <Text style={styles.viewDetails}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#1a5f7a" />
              </View>
            </TouchableOpacity>
          ))
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
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  patientMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  createdAt: {
    fontSize: 12,
    color: '#999',
  },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a5f7a',
    marginBottom: 8,
  },
  notesBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  scanButton: {
    backgroundColor: '#27ae60',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  visitsSection: {
    marginTop: 24,
  },
  visitsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  visitsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  visitsCount: {
    fontSize: 14,
    color: '#666',
  },
  emptyVisits: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyVisitsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  visitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  visitDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a5f7a',
  },
  visitContent: {
    gap: 8,
  },
  visitField: {
    gap: 4,
  },
  visitLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  visitValue: {
    fontSize: 14,
    color: '#333',
  },
  visitFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewDetails: {
    fontSize: 14,
    color: '#1a5f7a',
    fontWeight: '500',
  },
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  deleteModalBody: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  deleteModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  deleteModalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalBtnCancel: {
    backgroundColor: '#e8e8e8',
  },
  deleteModalBtnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deleteModalBtnDanger: {
    backgroundColor: '#e74c3c',
  },
  deleteModalBtnDangerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
