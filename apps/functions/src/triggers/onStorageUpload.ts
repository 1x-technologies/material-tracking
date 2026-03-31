import { onObjectFinalized } from 'firebase-functions/v2/storage';

export const onStorageFileUploaded = onObjectFinalized(
  {
    region: 'us-central1',
  },
  async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;

    if (!contentType?.startsWith('image/')) return;

    console.log(`File uploaded: ${filePath} (${contentType})`);
  },
);
