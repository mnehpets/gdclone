import { google, drive_v3 } from 'googleapis';
import { authorize } from './auth';

export async function getDriveClient(): Promise<drive_v3.Drive> {
  const authClient = await authorize();
  return google.drive({ version: 'v3', auth: authClient });
}

export async function findFolders(drive: drive_v3.Drive, nameOrId: string) {
  const isId = /^[a-zA-Z0-9_-]{20,}$/.test(nameOrId);
  
  let query = `mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (isId) {
    try {
      const res: any = await drive.files.get({
        fileId: nameOrId,
        fields: 'id, name, parents'
      });
      return res.data ? [res.data] : [];
    } catch (_e: any) { /* ignore */ }
  }

  query += ` and name='${nameOrId.replace(/'/g, "\\'")}'`;
  const res: any = await drive.files.list({
    q: query,
    fields: 'files(id, name, parents)',
    spaces: 'drive',
  });

  return res.data.files || [];
}

export async function resolveFullPath(drive: drive_v3.Drive, file: drive_v3.Schema$File): Promise<string> {
  let path = file.name || 'Unknown';
  let currentFile = file;

  while (currentFile.parents && currentFile.parents.length > 0) {
    const parentId = currentFile.parents[0];
    try {
      const parentRes: any = await drive.files.get({
        fileId: parentId,
        fields: 'id, name, parents',
      });
      if (parentRes.data && parentRes.data.name) {
        path = `${parentRes.data.name}/${path}`;
        currentFile = parentRes.data;
      } else {
        break;
      }
    } catch (_e) {
      break; 
    }
  }

  return path;
}

export async function getSampleFiles(drive: drive_v3.Drive, folderId: string, limit = 5) {
  const res: any = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(name, mimeType)',
    pageSize: limit,
  });
  return res.data.files || [];
}

export async function createFolder(drive: drive_v3.Drive, name: string, parentId?: string): Promise<string> {
  const fileMetadata: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const res: any = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });

  return res.data.id!;
}

export async function copyFile(drive: drive_v3.Drive, fileId: string, name: string, parentId: string) {
  try {
    await drive.files.copy({
      fileId,
      requestBody: {
        name,
        parents: [parentId],
      },
    });
  } catch (err: any) {
    if (err.code === 403 && err.message.includes('Quota')) {
      throw new Error(`403 Insufficient Quota: ${err.message}`, { cause: err });
    }
    throw err;
  }
}

export async function listFolderContents(drive: drive_v3.Drive, folderId: string) {
  let items: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const res: any = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      pageToken: pageToken || undefined,
    });
    if (res.data.files) {
      items = items.concat(res.data.files);
    }
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

  return items;
}

export async function shareFolder(drive: drive_v3.Drive, folderId: string, email: string) {
  await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      role: 'writer',
      type: 'user',
      emailAddress: email,
    },
    sendNotificationEmail: false,
  });
}
