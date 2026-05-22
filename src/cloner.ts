import { drive_v3 } from 'googleapis';
import cliProgress from 'cli-progress';
import { createFolder, copyFile, listFolderContents, shareFolder } from './drive';

export class InsufficientQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientQuotaError';
  }
}

export async function preScan(drive: drive_v3.Drive, sourceId: string): Promise<number> {
  let count = 0;
  const items = await listFolderContents(drive, sourceId);
  for (const item of items) {
    count++; // Count the item itself
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      count += await preScan(drive, item.id!);
    }
  }
  return count;
}

export async function cloneFolder(
  drive: drive_v3.Drive,
  sourceId: string,
  destName: string,
  shareWithEmail?: string,
) {
  console.log('Pre-scanning folder structure to calculate total items...');
  const totalItems = await preScan(drive, sourceId);
  // +1 for the root folder itself
  console.log(`Found ${totalItems} items to clone.`);

  const progressBar = new cliProgress.SingleBar(
    {
      format: 'Cloning |{bar}| {percentage}% || {value}/{total} items || Current: {item}',
    },
    cliProgress.Presets.shades_classic,
  );
  progressBar.start(totalItems + 1, 0, { item: 'Root Folder' });

  // 1. Create root destination folder
  const rootDestId = await createFolder(drive, destName);
  progressBar.increment(1, { item: 'Configuring sharing...' });

  // 2. Share if requested
  if (shareWithEmail) {
    try {
      await shareFolder(drive, rootDestId, shareWithEmail);
    } catch (err: unknown) {
      progressBar.stop();
      if (err instanceof Error) {
        console.warn(`\nWarning: Failed to share folder with ${shareWithEmail}. ${err.message}`);
      } else {
        console.warn(`\nWarning: Failed to share folder with ${shareWithEmail}.`);
      }
      progressBar.start(totalItems + 1, 1, { item: 'Continuing clone...' });
    }
  }

  // 3. Recursive clone
  await recursiveClone(drive, sourceId, rootDestId, progressBar);

  progressBar.stop();
  console.log('\nClone completed successfully.');
}

async function recursiveClone(
  drive: drive_v3.Drive,
  sourceId: string,
  destId: string,
  progressBar: cliProgress.SingleBar,
) {
  const items = await listFolderContents(drive, sourceId);

  // Sequential processing to avoid rate limits
  for (const item of items) {
    try {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        progressBar.update({ item: `Folder: ${item.name}` });
        const newFolderId = await createFolder(drive, item.name!, destId);
        progressBar.increment(1);
        await recursiveClone(drive, item.id!, newFolderId, progressBar);
      } else {
        progressBar.update({ item: `File: ${item.name}` });
        await copyFile(drive, item.id!, item.name!, destId);
        progressBar.increment(1);
      }
    } catch (err: unknown) {
      progressBar.stop();
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('403 Insufficient Quota')) {
        throw new InsufficientQuotaError(`Insufficient Drive storage quota to copy "${item.name}".`);
      }
      console.warn(`\nWarning: Failed to copy "${item.name}". Skipping. (${message})`);
      progressBar.start(progressBar.getTotal(), progressBar.getProgress() * progressBar.getTotal(), { item: 'Resuming...' });
    }
  }
}
