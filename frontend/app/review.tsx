import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { downloadExportPreview } from '@/lib/exportDownload';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

type StructuredShape = {
  name: string;
  age: number;
  gender: string;
  phone: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
};

function parseStructuredPayload(raw: string | undefined): StructuredShape {
  if (!raw) {
    return {
      name: 'Unknown',
      age: 0,
      gender: 'Unknown',
      phone: '',
      symptoms: '',
      diagnosis: '',
      prescription: '',
    };
  }
  try {
    const d = JSON.parse(raw) as Record<string, unknown>;
    const ageVal = d.age;
    const age =
      typeof ageVal === 'number'
        ? ageVal
        : parseInt(String(ageVal ?? '0'), 10) || 0;
    return {
      name: String(d.name ?? 'Unknown'),
      age,
      gender: String(d.gender ?? 'Unknown'),
      phone: String(d.phone ?? ''),
      symptoms: String(d.symptoms ?? ''),
      diagnosis: String(d.diagnosis ?? ''),
      prescription: String(d.prescription ?? ''),
    };
  } catch {
    return {
      name: 'Unknown',
      age: 0,
      gender: 'Unknown',
      phone: '',
      symptoms: '',
      diagnosis: '',
      prescription: '',
    };
  }
}

export default function ReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawText = (params.rawText as string) || '';
  const confidence = parseFloat((params.confidence as string) || '0');
  const imageBase64 = (params.imageBase64 as string) || '';

  const structuredPayload = useMemo(
    () => parseStructuredPayload(params.structuredData as string | undefined),
    [params.structuredData]
  );

  /** Full server payload (includes appointment_table); merged so legacy fields stay available for save. */
  const mergedStructuredData = useMemo(() => {
    let fromServer: Record<string, unknown> = {};
    try {
      const s = params.structuredData;
      if (typeof s === 'string' && s) fromServer = JSON.parse(s) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
    return { ...structuredPayload, ...fromServer } as Record<string, unknown>;
  }, [params.structuredData, structuredPayload]);

  const appointmentRows = useMemo(() => {
    const at = mergedStructuredData.appointment_table as
      | { rows?: unknown[] }
      | undefined;
    if (at && Array.isArray(at.rows)) {
      return at.rows.filter(
        (r): r is (string | number | null | undefined)[] => Array.isArray(r)
      );
    }
    return [];
  }, [mergedStructuredData]);

  const [saving, setSaving] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false);
  const [savedPatientCount, setSavedPatientCount] = useState(0);

  const handleSave = async () => {
    if (!API_URL) {
      Alert.alert('Error', 'API address is not configured.');
      return;
    }

    setSaving(true);
    try {
      if (appointmentRows.length > 0) {
        const res = await axios.post(`${API_URL}/api/patients/bulk-from-scan`, {
          rows: appointmentRows,
          raw_text: rawText,
          image_base64: imageBase64 || undefined,
          structured_data: mergedStructuredData,
        });
        const created = res.data.created ?? 0;
        if (created === 0) {
          Alert.alert(
            'No profiles created',
            'Each row needs at least a name or a mobile number. Check the scan or try again.'
          );
          return;
        }
        setSavedPatientCount(created);
        setSaveSuccessVisible(true);
        return;
      }

      const patientName =
        structuredPayload.name.trim() &&
        structuredPayload.name.trim() !== 'Unknown'
          ? structuredPayload.name.trim()
          : 'Scan record';

      const patientResponse = await axios.post(`${API_URL}/api/patients`, {
        name: patientName,
        age: structuredPayload.age,
        gender: structuredPayload.gender,
        phone: structuredPayload.phone || '',
        doctor_name: '',
        notes: '',
      });

      await axios.post(`${API_URL}/api/visits`, {
        patient_id: patientResponse.data.id,
        symptoms: structuredPayload.symptoms,
        diagnosis: structuredPayload.diagnosis,
        prescription: structuredPayload.prescription,
        raw_text: rawText,
        structured_data: mergedStructuredData,
        image_base64: imageBase64 || undefined,
      });

      setSavedPatientCount(1);
      setSaveSuccessVisible(true);
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert(
        'Save Failed',
        error.response?.data?.detail ||
          error.message ||
          'Failed to save record. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const dismissSuccess = () => {
    setSaveSuccessVisible(false);
    if (savedPatientCount > 0 && appointmentRows.length > 0) {
      router.replace('/patients');
    } else {
      router.replace('/visits');
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={saveSuccessVisible}
        transparent
        animationType="fade"
        onRequestClose={dismissSuccess}
      >
        <View style={styles.successModalBackdrop}>
          <View style={styles.successModalCard}>
            <Ionicons name="checkmark-circle" size={48} color="#27ae60" />
            <Text style={styles.successModalTitle}>Saved</Text>
            <Text style={styles.successModalBody}>
              {savedPatientCount > 0
                ? `${savedPatientCount} patient profile${savedPatientCount === 1 ? '' : 's'} saved under Patients, and one visit was added under Visits with the full sheet (for Excel / JSON / XML).`
                : 'Visit saved from this scan.'}
            </Text>
            <Pressable style={styles.successModalOk} onPress={dismissSuccess}>
              <Text style={styles.successModalOkText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.confidenceCard}>
          <View style={styles.confidenceHeader}>
            <Ionicons
              name={confidence > 50 ? 'checkmark-circle' : 'warning'}
              size={24}
              color={confidence > 50 ? '#27ae60' : '#f39c12'}
            />
            <Text style={styles.confidenceText}>Extraction confidence</Text>
          </View>
          <Text
            style={[
              styles.confidenceScore,
              { color: confidence > 50 ? '#27ae60' : '#f39c12' },
            ]}
          >
            {confidence.toFixed(1)}%
          </Text>
          <Text style={styles.confidenceHint}>
            Download files below, or save: each sheet row becomes a patient profile with the
            details captured from the image.
          </Text>
        </View>

        <View style={styles.profilePreviewCard}>
          <Text style={styles.profilePreviewTitle}>Patient profiles from this scan</Text>
          <Text style={styles.profilePreviewBody}>
            One profile is created per table row. We store: patient name, mobile number,
            doctor name, age and sex (from AGE/SEX), and comments (remarks plus appointment
            time and sheet S.No in profile notes). The scan image is attached to the first
            visit only.
          </Text>
          <Text style={styles.profilePreviewCount}>
            {appointmentRows.length > 0
              ? `${appointmentRows.length} row${appointmentRows.length === 1 ? '' : 's'} ready to save`
              : 'No appointment rows detected — save will create one legacy visit if possible'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.rawTextToggle}
          onPress={() => setShowRawText(!showRawText)}
        >
          <Ionicons
            name={showRawText ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#1a5f7a"
          />
          <Text style={styles.rawTextToggleText}>OCR extracted text</Text>
        </TouchableOpacity>

        {showRawText && (
          <View style={styles.rawTextContainer}>
            <Text style={styles.rawText}>{rawText || 'No text extracted'}</Text>
          </View>
        )}

        <View style={styles.exportSection}>
          <Text style={styles.sectionTitle}>Download extract</Text>
          <Text style={styles.exportHint}>
            Download the full appointment table here, or after Save open Visits — one row per
            photo with Excel / JSON / XML. Patient profiles are created separately in Patients.
          </Text>
          <View style={styles.exportRow}>
            <TouchableOpacity
              style={styles.exportChip}
              onPress={() =>
                downloadExportPreview(
                  API_URL,
                  rawText,
                  mergedStructuredData,
                  'json',
                  'scan-extract.json'
                )
              }
            >
              <Ionicons name="document-text" size={18} color="#fff" />
              <Text style={styles.exportChipText}>JSON</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportChip, styles.exportChipXml]}
              onPress={() =>
                downloadExportPreview(
                  API_URL,
                  rawText,
                  mergedStructuredData,
                  'xml',
                  'scan-extract.xml'
                )
              }
            >
              <Ionicons name="code" size={18} color="#fff" />
              <Text style={styles.exportChipText}>XML</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportChip, styles.exportChipXlsx]}
              onPress={() =>
                downloadExportPreview(
                  API_URL,
                  rawText,
                  mergedStructuredData,
                  'xlsx',
                  'scan-extract.xlsx'
                )
              }
            >
              <Ionicons name="grid" size={18} color="#fff" />
              <Text style={styles.exportChipText}>Excel</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </>
          ) : (
            <>
              <Ionicons name="save" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>
                {appointmentRows.length > 0
                  ? `Save ${appointmentRows.length} patient${appointmentRows.length === 1 ? '' : 's'}`
                  : 'Save to visits'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  confidenceCard: {
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
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  confidenceScore: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  confidenceHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    lineHeight: 18,
  },
  profilePreviewCard: {
    backgroundColor: '#e8f4fc',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#b8d4e8',
  },
  profilePreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a5f7a',
    marginBottom: 8,
  },
  profilePreviewBody: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 10,
  },
  profilePreviewCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a085',
  },
  rawTextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  rawTextToggleText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1a5f7a',
    fontWeight: '500',
  },
  rawTextContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  rawText: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  exportSection: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  exportHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  exportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  exportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a5f7a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  exportChipXml: {
    backgroundColor: '#8e44ad',
  },
  exportChipXlsx: {
    backgroundColor: '#27ae60',
  },
  exportChipText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  successModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  successModalBody: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successModalOk: {
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  successModalOkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
