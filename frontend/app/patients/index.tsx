import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
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

export default function PatientsScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchPatients = async (searchQuery?: string) => {
    if (!API_URL) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await axios.get(`${API_URL}/api/patients`, { params });
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPatients(search);
    }, [search])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatients(search);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
  };

  const getGenderIcon = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male':
        return 'male';
      case 'female':
        return 'female';
      default:
        return 'person';
    }
  };

  const getGenderColor = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male':
        return '#3498db';
      case 'female':
        return '#e91e63';
      default:
        return '#95a5a6';
    }
  };

  const executeDeletePatient = async () => {
    if (!deleteTarget || !API_URL) return;
    setDeleteBusy(true);
    try {
      await axios.delete(`${API_URL}/api/patients/${encodeURIComponent(deleteTarget.id)}`);
      setDeleteTarget(null);
      await fetchPatients(search);
    } catch (error: any) {
      console.error('Delete patient error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || error.message || 'Failed to delete patient.'
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const renderPatient = ({ item }: { item: Patient }) => (
    <View style={styles.patientCard}>
      <View style={[styles.patientAvatar, { backgroundColor: getGenderColor(item.gender) + '20' }]}>
        <Ionicons name={getGenderIcon(item.gender)} size={28} color={getGenderColor(item.gender)} />
      </View>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <View style={styles.patientDetails}>
          <Text style={styles.patientDetail}>{item.age} years</Text>
          <Text style={styles.patientDetailDivider}>|</Text>
          <Text style={styles.patientDetail}>{item.gender}</Text>
          {item.phone && (
            <>
              <Text style={styles.patientDetailDivider}>|</Text>
              <Text style={styles.patientDetail}>{item.phone}</Text>
            </>
          )}
        </View>
        {item.doctor_name ? (
          <Text style={styles.doctorSub} numberOfLines={1}>
            {item.doctor_name}
          </Text>
        ) : null}
        {item.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#888" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => router.push(`/patients/${item.id}`)}
          activeOpacity={0.8}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => setDeleteTarget(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5f7a" />
        <Text style={styles.loadingText}>Loading patients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => !deleteBusy && setDeleteTarget(null)}
      >
        <View style={styles.deleteModalBackdrop}>
          <View style={styles.deleteModalCard}>
            <Text style={styles.deleteModalTitle}>Delete patient</Text>
            <Text style={styles.deleteModalBody}>
              Remove {deleteTarget?.name ?? 'this patient'}? All visits for this patient will be
              deleted too.
            </Text>
            <View style={styles.deleteModalActions}>
              <Pressable
                style={[styles.deleteModalBtn, styles.deleteModalBtnCancel]}
                onPress={() => !deleteBusy && setDeleteTarget(null)}
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          value={search}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Patient Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>{patients.length} patients</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/patients/new')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Patient List */}
      <FlatList
        data={patients}
        renderItem={renderPatient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No patients found</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/patients/new')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Add Patient</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  countText: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardActions: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 8,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a5f7a',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
    minWidth: 76,
  },
  viewBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
    minWidth: 76,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  patientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientInfo: {
    flex: 1,
    marginLeft: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  patientDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  patientDetail: {
    fontSize: 13,
    color: '#666',
  },
  patientDetailDivider: {
    fontSize: 13,
    color: '#ccc',
    marginHorizontal: 8,
  },
  doctorSub: {
    fontSize: 12,
    color: '#5d6d7e',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a5f7a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
