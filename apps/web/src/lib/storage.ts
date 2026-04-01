import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseStorage } from "../firebase";

export async function uploadScanPhoto(file: File, shipmentId: string, pieceId: string): Promise<string> {
  const path = `photos/${shipmentId}/${pieceId}/${Date.now()}.jpg`;
  const storageRef = ref(firebaseStorage, path);
  const result = await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(result.ref);
}

export async function uploadSignaturePng(blob: Blob, shipmentId: string, pieceId: string): Promise<string> {
  const path = `signatures/${shipmentId}/${pieceId}/${Date.now()}.png`;
  const storageRef = ref(firebaseStorage, path);
  const result = await uploadBytes(storageRef, blob, { contentType: "image/png" });
  return getDownloadURL(result.ref);
}
