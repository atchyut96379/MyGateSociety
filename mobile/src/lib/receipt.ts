import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { API_BASE } from "../config";
import { ApiError } from "../api/client";

export async function shareBillReceipt(token: string, billId: string) {
  const filename = `receipt-${billId}.pdf`;
  const path = `${FileSystem.cacheDirectory}${filename}`;

  const result = await FileSystem.downloadAsync(
    `${API_BASE}/bills/${billId}/receipt`,
    path,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (result.status !== 200) {
    throw new ApiError(result.status, "Could not download receipt");
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new ApiError(503, "Sharing is not available on this device");
  }
  await Sharing.shareAsync(result.uri, { mimeType: "application/pdf", dialogTitle: filename });
}
