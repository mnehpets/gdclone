import { google, drive_v3 } from 'googleapis';
import { authorize } from './auth';

export async function getDriveClient(): Promise<drive_v3.Drive> {
  const authClient = await authorize();
  return google.drive({ version: 'v3', auth: authClient });
}

export async function findFolders(drive: drive_v3.Drive, nameOrId: string) {
  let query = `mimeType='application/vnd.google-apps.folder' and trashed=false`;

  try {
    const res = await drive.files.get({
      fileId: nameOrId,
      fields: 'id, name, parents, mimeType',
      supportsAllDrives: true,
    });
    if (res.data && res.data.mimeType === 'application/vnd.google-apps.folder') {
      return [res.data];
    }
  } catch (_e: unknown) {
    /* ignore and fallback to name query */
  }

  query += ` and name='${nameOrId.replace(/'/g, "\\'")}'`;
  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name, parents, mimeType)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return res.data.files || [];
}

export async function resolveFullPath(
  drive: drive_v3.Drive,
  file: drive_v3.Schema$File,
): Promise<string> {
  let path = file.name || 'Unknown';
  let currentFile = file;

  while (currentFile.parents && currentFile.parents.length > 0) {
    const parentId = currentFile.parents[0];
    try {
      const parentRes = await drive.files.get({
        fileId: parentId,
        fields: 'id, name, parents',
        supportsAllDrives: true,
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
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(name, mimeType)',
    pageSize: limit,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data.files || [];
}

export async function createFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId?: string,
): Promise<string> {
  const fileMetadata: drive_v3.Schema$File = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const res = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
    supportsAllDrives: true,
  });

  return res.data.id!;
}

export async function copyFile(
  drive: drive_v3.Drive,
  fileId: string,
  name: string,
  parentId: string,
) {
  try {
    await drive.files.copy({
      fileId,
      requestBody: {
        name,
        parents: [parentId],
      },
      supportsAllDrives: true,
    });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      err.code === 403 &&
      err.message.includes('Quota')
    ) {
      throw new Error(`403 Insufficient Quota: ${err.message}`, { cause: err });
    }
    throw err;
  }
}

export async function listFolderContents(drive: drive_v3.Drive, folderId: string) {
  let items: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const params: drive_v3.Params$Resource$Files$List = {
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      pageToken: pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    };
    const response = await drive.files.list(params);
    if (response.data.files) {
      items = items.concat(response.data.files);
    }
    pageToken = response.data.nextPageToken || undefined;
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
    supportsAllDrives: true,
  });
}
