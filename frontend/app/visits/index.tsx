import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { downloadFromUrl } from '@/lib/exportDownload';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

interface Visit {
  id: string;
  patient_id: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  created_at: string;
  has_image?: boolean;
  structured_data?: Record<string, unknown>;
}

function isSheetBatchVisit(v: Visit): boolean {
  return v.structured_data?.visit_kind === 'appointment_sheet_batch';
}

function batchPatientCount(v: Visit): number | null {
  const ids = v.structured_data?.patient_ids_created;
  return Array.isArray(ids) ? ids.length : null;
}

interface Patient {
  id: string;
  name: string;
}

export default function VisitsScreen() {
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [patients, setPatients] = useState<Map<string, Patient>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [visitsRes, patientsRes] = await Promise.all([
        axios.get(`${API_URL}/api/visits`),
        axios.get(`${API_URL}/api/patients`),
      ]);
      
      setVisits(visitsRes.data);
      
      const patientMap = new Map<string, Patient>();
      patientsRes.data.forEach((p: Patient) => {
        patientMap.set(p.id, p);
      });
      setPatients(patientMap);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderVisit = ({ item }: { item: Visit }) => {
    const patient = patients.get(item.patient_id);
    const thumbUri = item.has_image
      ? `${API_URL}/api/visits/${item.id}/image`
      : null;
    const batch = isSheetBatchVisit(item);
    const nPatients = batchPatientCount(item);

    return (
      <View style={styles.visitCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push(`/visits/${item.id}`)}
        >
          <View style={styles.visitHeader}>
            {thumbUri ? (
              <Image
                source={{ uri: thumbUri }}
                style={styles.visitThumb}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.visitThumbPlaceholder}>
                <Ionicons name="document-text-outline" size={28} color="#ccc" />
              </View>
            )}
            <View style={styles.visitHeaderText}>
              <View style={styles.dateContainer}>
                <Text style={styles.visitDate}>{formatDate(item.created_at)}</Text>
                <Text style={styles.visitTime}>{formatTime(item.created_at)}</Text>
              </View>
              {batch ? (
                <View>
                  <View style={styles.patientBadge}>
                    <Ionicons name="grid" size={14} color="#1a5f7a" />
                    <Text style={styles.patientName}>Full sheet (one scan)</Text>
                  </View>
                  {nPatients != null ? (
                    <Text style={styles.batchHint}>
                      {nPatients} patient{nPatients === 1 ? '' : 's'} in Patients list
                    </Text>
                  ) : null}
                </View>
              ) : (
                <View style={styles.patientBadge}>
                  <Ionicons name="person" size={14} color="#1a5f7a" />
                  <Text style={styles.patientName}>{patient?.name || 'Unknown'}</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>

          <View style={styles.visitContent}>
            <View style={styles.visitField}>
              <Ionicons name="thermometer" size={16} color="#e74c3c" />
              <Text style={styles.visitFieldText} numberOfLines={1}>
                {batch
                  ? 'Full appointment table — use Export below'
                  : item.symptoms || 'No symptoms recorded'}
              </Text>
            </View>
            <View style={styles.visitField}>
              <Ionicons name="medical" size={16} color="#27ae60" />
              <Text style={styles.visitFieldText} numberOfLines={1}>
                {item.diagnosis || 'No diagnosis'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.exportRow}>
          <Text style={styles.exportLabel}>Export</Text>
          <TouchableOpacity
            style={styles.exportMini}
            onPress={() =>
              downloadFromUrl(
                `${API_URL}/api/visits/${item.id}/export?format=json`,
                `visit-${item.id}.json`
              )
            }
          >
            <Text style={styles.exportMiniText}>JSON</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportMini, styles.exportMiniXml]}
            onPress={() =>
              downloadFromUrl(
                `${API_URL}/api/visits/${item.id}/export?format=xml`,
                `visit-${item.id}.xml`
              )
            }
          >
            <Text style={styles.exportMiniText}>XML</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportMini, styles.exportMiniXlsx]}
            onPress={() =>
              downloadFromUrl(
                `${API_URL}/api/visits/${item.id}/export?format=xlsx`,
                `visit-${item.id}.xlsx`
              )
            }
          >
            <Text style={styles.exportMiniText}>Excel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5f7a" />
        <Text style={styles.loadingText}>Loading visits...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{visits.length} Visits</Text>
          <Text style={styles.headerSubtitle}>
            Each photo adds one visit with full-table export. Rows also create patient profiles.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push('/scan')}
        >
          <Ionicons name="scan" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>New Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Visits List */}
      <FlatList
        data={visits}
        renderItem={renderVisit}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No visits recorded yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/scan')}
            >
              <Ionicons name="scan" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Scan Record</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
    gap: 12,
    marginBottom: 12,
  },
  visitThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  visitThumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitHeaderText: {
    flex: 1,
  },
  dateContainer: {
    gap: 2,
  },
  visitDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  visitTime: {
    fontSize: 12,
    color: '#999',
  },
  patientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  patientName: {
    fontSize: 12,
    color: '#1a5f7a',
    fontWeight: '500',
  },
  visitContent: {
    gap: 8,
  },
  visitField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visitFieldText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  batchHint: {
    fontSize: 11,
    color: '#16a085',
    marginTop: 4,
    marginLeft: 2,
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  exportLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  exportMini: {
    backgroundColor: '#1a5f7a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exportMiniXml: {
    backgroundColor: '#8e44ad',
  },
  exportMiniXlsx: {
    backgroundColor: '#27ae60',
  },
  exportMiniText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: '#e74c3c',
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
});
