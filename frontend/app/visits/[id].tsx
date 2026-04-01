import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  raw_text?: string;
  structured_data?: Record<string, unknown>;
  has_image?: boolean;
  image_path?: string | null;
  created_at: string;
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
  age: number;
  gender: string;
  phone: string;
  location?: string;
}

export default function VisitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImage, setShowImage] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const visitRes = await axios.get(`${API_URL}/api/visits/${id}`);
      setVisit(visitRes.data);
      
      if (visitRes.data.patient_id) {
        const patientRes = await axios.get(`${API_URL}/api/patients/${visitRes.data.patient_id}`);
        setPatient(patientRes.data);
      }
    } catch (error) {
      console.error('Error fetching visit:', error);
      Alert.alert('Error', 'Failed to load visit details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Visit',
      'Are you sure you want to delete this visit record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/visits/${id}`);
              Alert.alert('Success', 'Visit deleted successfully');
              router.back();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete visit');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  if (!visit) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Visit not found</Text>
      </View>
    );
  }

  const batch = isSheetBatchVisit(visit);
  const nPatients = batchPatientCount(visit);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Visit Date */}
      <View style={styles.dateCard}>
        <Ionicons name="calendar" size={24} color="#1a5f7a" />
        <Text style={styles.dateText}>{formatDate(visit.created_at)}</Text>
      </View>

      {batch ? (
        <View style={styles.batchBanner}>
          <Ionicons name="grid" size={22} color="#1a5f7a" />
          <View style={styles.batchBannerText}>
            <Text style={styles.batchBannerTitle}>Full sheet scan</Text>
            <Text style={styles.batchBannerBody}>
              This visit stores the whole extracted table for export (Excel / JSON / XML). Individual
              profiles are on the Patients tab
              {nPatients != null ? ` (${nPatients} from this scan)` : ''}.
            </Text>
          </View>
        </View>
      ) : null}

      {/* Patient Info */}
      {patient && (
        <TouchableOpacity
          style={styles.patientCard}
          onPress={() => router.push(`/patients/${patient.id}`)}
        >
          <View style={styles.patientAvatar}>
            <Ionicons
              name={patient.gender.toLowerCase() === 'female' ? 'female' : 'male'}
              size={28}
              color="#1a5f7a"
            />
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient.name}</Text>
            {batch ? (
              <Text style={styles.patientBatchNote}>First row — open Patients for everyone on this sheet</Text>
            ) : null}
            <Text style={styles.patientMeta}>
              {patient.age} years | {patient.gender}
              {patient.location ? ` | ${patient.location}` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      )}

      {/* Visit Details */}
      <View style={styles.detailsCard}>
        <View style={styles.detailSection}>
          <View style={styles.detailHeader}>
            <Ionicons name="thermometer" size={20} color="#e74c3c" />
            <Text style={styles.detailTitle}>Symptoms</Text>
          </View>
          <Text style={styles.detailContent}>
            {batch
              ? 'See export files for the full appointment table. Per-row symptoms are on each patient profile.'
              : visit.symptoms || 'No symptoms recorded'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <View style={styles.detailHeader}>
            <Ionicons name="medical" size={20} color="#27ae60" />
            <Text style={styles.detailTitle}>Diagnosis</Text>
          </View>
          <Text style={styles.detailContent}>
            {visit.diagnosis || 'No diagnosis recorded'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailSection}>
          <View style={styles.detailHeader}>
            <Ionicons name="document-text" size={20} color="#3498db" />
            <Text style={styles.detailTitle}>Prescription</Text>
          </View>
          <Text style={styles.detailContent}>
            {visit.prescription || 'No prescription recorded'}
          </Text>
        </View>
      </View>

      {visit.raw_text ? (
        <View style={styles.detailsCard}>
          <TouchableOpacity
            style={styles.imageHeader}
            onPress={() => setShowRaw(!showRaw)}
          >
            <Ionicons name="text" size={20} color="#1a5f7a" />
            <Text style={styles.imageTitle}>OCR raw text</Text>
            <Ionicons
              name={showRaw ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#1a5f7a"
            />
          </TouchableOpacity>
          {showRaw ? (
            <Text style={styles.rawTextBlock}>{visit.raw_text}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Scanned Image */}
      {visit.has_image ? (
        <View style={styles.imageSection}>
          <TouchableOpacity
            style={styles.imageHeader}
            onPress={() => setShowImage(!showImage)}
          >
            <Ionicons name="image" size={20} color="#1a5f7a" />
            <Text style={styles.imageTitle}>Scanned Record</Text>
            <Ionicons
              name={showImage ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#1a5f7a"
            />
          </TouchableOpacity>
          {showImage && (
            <Image
              source={{ uri: `${API_URL}/api/visits/${visit.id}/image` }}
              style={styles.scannedImage}
              resizeMode="contain"
            />
          )}
        </View>
      ) : null}

      <View style={styles.exportCard}>
        <Text style={styles.exportCardTitle}>Export full record</Text>
        <Text style={styles.exportCardHint}>
          Download the extracted table for this visit (includes all rows when this was a sheet scan).
        </Text>
        <View style={styles.exportButtons}>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() =>
              downloadFromUrl(
                `${API_URL}/api/visits/${visit.id}/export?format=json`,
                `visit-${visit.id}.json`
              )
            }
          >
            <Text style={styles.exportBtnText}>JSON</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportBtn, styles.exportBtnXml]}
            onPress={() =>
              downloadFromUrl(
                `${API_URL}/api/visits/${visit.id}/export?format=xml`,
                `visit-${visit.id}.xml`
              )
            }
          >
            <Text style={styles.exportBtnText}>XML</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportBtn, styles.exportBtnXlsx]}
            onPress={() =>
              downloadFromUrl(
                `${API_URL}/api/visits/${visit.id}/export?format=xlsx`,
                `visit-${visit.id}.xlsx`
              )
            }
          >
            <Text style={styles.exportBtnText}>Excel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash" size={20} color="#fff" />
        <Text style={styles.deleteButtonText}>Delete Visit</Text>
      </TouchableOpacity>
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
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#1a5f7a',
    fontWeight: '500',
  },
  batchBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#e8f8f5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#b8e0d6',
  },
  batchBannerText: {
    flex: 1,
  },
  batchBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a5f7a',
    marginBottom: 6,
  },
  batchBannerBody: {
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f4f8',
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
  patientBatchNote: {
    fontSize: 12,
    color: '#16a085',
    marginBottom: 4,
  },
  patientMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailSection: {
    paddingVertical: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  detailContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  rawTextBlock: {
    fontSize: 12,
    color: '#555',
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontFamily: 'monospace',
  },
  imageSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  imageTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a5f7a',
  },
  scannedImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  exportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  exportCardHint: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  exportButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  exportBtn: {
    backgroundColor: '#1a5f7a',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exportBtnXml: {
    backgroundColor: '#8e44ad',
  },
  exportBtnXlsx: {
    backgroundColor: '#27ae60',
  },
  exportBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
