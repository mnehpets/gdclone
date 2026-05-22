#!/usr/bin/env node

import { Command } from 'commander';
import prompts from 'prompts';
import { getDriveClient } from './drive';
import { findFolders, resolveFullPath, getSampleFiles } from './drive';
import { cloneFolder } from './cloner';

const program = new Command();

program
  .name('gdclone')
  .description('CLI tool for recursive Google Drive folder cloning')
  .version('1.0.0')
  .argument('<source>', 'Source folder name or ID')
  .argument('<dest>', 'Destination folder name')
  .option('-s, --share-with <email>', 'Email to share the cloned folder with (Editor access)')
  .option('-y, --yolo', 'Skip confirmation prompts')
  .action(async (source, dest, options) => {
    try {
      const drive = await getDriveClient();
      console.log(`Authenticated successfully.\n`);

      const folders = await findFolders(drive, source);
      if (folders.length === 0) {
        console.error(`Error: Could not find folder with name or ID '${source}'`);
        process.exit(1);
      }

      let sourceFolder = folders[0];

      if (folders.length > 1) {
        const choices = await Promise.all(
          folders.map(async (f) => {
            const fullPath = await resolveFullPath(drive, f);
            return { title: fullPath, value: f };
          }),
        );

        const response = await prompts({
          type: 'select',
          name: 'folder',
          message: 'Multiple folders found. Which one do you want to clone?',
          choices,
        });

        if (!response.folder) {
          console.error('Operation cancelled.');
          process.exit(1);
        }
        sourceFolder = response.folder;
      }

      const folderId = sourceFolder.id!;
      const folderPath = await resolveFullPath(drive, sourceFolder);

      console.log(`Selected Source: ${folderPath} (${folderId})`);
      console.log(`Destination Name: ${dest}`);

      const sampleFiles = await getSampleFiles(drive, folderId, 5);
      if (sampleFiles.length > 0) {
        console.log(`\nSample contents of source folder:`);
        sampleFiles.forEach((f) => console.log(` - ${f.name}`));
        console.log(`   ...`);
      } else {
        console.log(`\nSource folder is empty or unreadable.`);
      }

      if (!options.yolo) {
        const confirm = await prompts({
          type: 'confirm',
          name: 'value',
          message: `Are you sure you want to clone <${folderPath}> to <${dest}>?`,
          initial: false,
        });

        if (!confirm.value) {
          console.log('Operation cancelled.');
          process.exit(0);
        }
      }

      console.log('Cloning process will start soon...');
      await cloneFolder(drive, folderId, dest, options.shareWith);
      process.exit(0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`Error: ${err.message}`);
      } else {
        console.error(`An unexpected error occurred: ${String(err)}`);
      }
      process.exit(1);
    }
  });

program.parse(process.argv);
