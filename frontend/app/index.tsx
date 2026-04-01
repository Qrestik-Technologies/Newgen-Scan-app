import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Stats {
  total_patients: number;
  total_visits: number;
  today_visits: number;
  recent_visits: RecentVisit[];
}

interface RecentVisit {
  id: string;
  created_at?: string;
  diagnosis?: string;
  symptoms?: string;
}

function formatVisitScanDateTime(createdAt: string | undefined): string {
  if (!createdAt) return 'Scan date unknown';
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return 'Scan date unknown';
  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} · ${time}`;
}

export default function Dashboard() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const isNarrow = windowWidth < 380;
  const compactActions = windowWidth < 420;
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5f7a" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Clinic Digitization</Text>
            <Text style={styles.headerSubtitle}>
              Scan & Manage Patient Records
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View
          style={[
            styles.statsContainer,
            isNarrow && styles.statsContainerStacked,
          ]}
        >
          <View
            style={[
              styles.statCard,
              isNarrow && styles.statCardFullWidth,
              { backgroundColor: '#4a90d9' },
            ]}
          >
            <Ionicons name="people" size={28} color="#fff" />
            <View
              style={[styles.statTexts, isNarrow && styles.statTextsInline]}
            >
              <Text style={[styles.statNumber, isNarrow && styles.statNumberInline]}>
                {stats?.total_patients || 0}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  isNarrow && styles.statLabelStart,
                ]}
              >
                Total Patients
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statCard,
              isNarrow && styles.statCardFullWidth,
              { backgroundColor: '#6ab04c' },
            ]}
          >
            <Ionicons name="clipboard" size={28} color="#fff" />
            <View
              style={[styles.statTexts, isNarrow && styles.statTextsInline]}
            >
              <Text style={[styles.statNumber, isNarrow && styles.statNumberInline]}>
                {stats?.total_visits || 0}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  isNarrow && styles.statLabelStart,
                ]}
              >
                Total Visits
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statCard,
              isNarrow && styles.statCardFullWidth,
              { backgroundColor: '#f0932b' },
            ]}
          >
            <Ionicons name="today" size={28} color="#fff" />
            <View
              style={[styles.statTexts, isNarrow && styles.statTextsInline]}
            >
              <Text style={[styles.statNumber, isNarrow && styles.statNumberInline]}>
                {stats?.today_visits || 0}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  isNarrow && styles.statLabelStart,
                ]}
              >
                Today's Visits
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View
          style={[
            styles.actionsContainer,
            compactActions && styles.actionsContainerStacked,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              compactActions && styles.actionButtonFullWidth,
              styles.scanButton,
            ]}
            onPress={() => router.push('/scan')}
          >
            <Ionicons name="scan" size={32} color="#fff" />
            <Text style={styles.actionText}>Scan Record</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              compactActions && styles.actionButtonFullWidth,
              styles.patientsButton,
            ]}
            onPress={() => router.push('/patients')}
          >
            <Ionicons name="people" size={32} color="#fff" />
            <Text style={styles.actionText}>Patients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              compactActions && styles.actionButtonFullWidth,
              styles.visitsButton,
            ]}
            onPress={() => router.push('/visits')}
          >
            <Ionicons name="calendar" size={32} color="#fff" />
            <Text style={styles.actionText}>Visits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              compactActions && styles.actionButtonFullWidth,
              styles.newPatientButton,
            ]}
            onPress={() => router.push('/patients/new')}
          >
            <Ionicons name="person-add" size={32} color="#fff" />
            <Text style={styles.actionText}>Add Patient</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Visits */}
        {stats?.recent_visits && stats.recent_visits.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Visits</Text>
            <View style={styles.recentContainer}>
              {stats.recent_visits.slice(0, 5).map((visit, index) => (
                <TouchableOpacity
                  key={visit.id || index}
                  style={styles.recentItem}
                  onPress={() => router.push(`/visits/${visit.id}`)}
                >
                  <View style={styles.recentIcon}>
                    <Ionicons name="document-text" size={24} color="#1a5f7a" />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentScanTitle} numberOfLines={1}>
                      {formatVisitScanDateTime(visit.created_at)}
                    </Text>
                    <Text style={styles.recentSubtitle} numberOfLines={1}>
                      {visit.diagnosis || 'No diagnosis'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
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
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#1a5f7a',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  headerTextBlock: {
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    lineHeight: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 0,
    gap: 10,
  },
  statsContainerStacked: {
    flexDirection: 'column',
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardFullWidth: {
    flex: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    gap: 14,
  },
  statTexts: {
    alignItems: 'center',
  },
  statTextsInline: {
    flex: 1,
    alignItems: 'flex-start',
    minWidth: 0,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statNumberInline: {
    marginTop: 0,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  statLabelStart: {
    textAlign: 'left',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionsContainerStacked: {
    flexDirection: 'column',
  },
  actionButton: {
    width: '48%',
    minHeight: 96,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 4,
  },
  actionButtonFullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  scanButton: {
    backgroundColor: '#e74c3c',
  },
  patientsButton: {
    backgroundColor: '#3498db',
  },
  visitsButton: {
    backgroundColor: '#9b59b6',
  },
  newPatientButton: {
    backgroundColor: '#27ae60',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  recentContainer: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentScanTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  recentSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
