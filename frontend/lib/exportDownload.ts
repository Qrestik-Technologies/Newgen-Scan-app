import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

function base64FromArrayBuffer(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** GET request (visit export endpoints). */
export async function downloadFromUrl(url: string, filename: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
      return;
    }

    const dest = `${FileSystem.cacheDirectory ?? ''}${filename}`;
    const result = await FileSystem.downloadAsync(url, dest);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri);
    } else {
      Alert.alert('Downloaded', result.uri);
    }
  } catch (e) {
    Alert.alert('Download failed', e instanceof Error ? e.message : String(e));
  }
}

/** POST /api/export/preview with JSON body. */
export async function downloadExportPreview(
  apiBase: string,
  rawText: string,
  structuredData: Record<string, unknown>,
  format: 'json' | 'xml' | 'xlsx',
  filename: string
): Promise<void> {
  const url = `${apiBase}/api/export/preview?format=${format}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: '*/*' },
      body: JSON.stringify({
        raw_text: rawText,
        structured_data: structuredData,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();

    if (Platform.OS === 'web') {
      const blob = new Blob([buf]);
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
      return;
    }

    const dest = `${FileSystem.cacheDirectory ?? ''}${filename}`;
    const b64 = base64FromArrayBuffer(buf);
    await FileSystem.writeAsStringAsync(dest, b64, {
      encoding: 'base64',
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(dest);
    } else {
      Alert.alert('Saved', dest);
    }
  } catch (e) {
    Alert.alert('Download failed', e instanceof Error ? e.message : String(e));
  }
}
