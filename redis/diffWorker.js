import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { connection } from './redisClient.js';
import { Octokit } from 'octokit';
import weaviateClient from '../weaviatedb/weaviateClient.js';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Threshold to skip overly large diffs
const MAX_PATCH_LENGTH = parseInt(process.env.MAX_PATCH_LENGTH || '10000', 10);

// Directory to store diff logs
const LOG_DIR = process.env.DIFF_LOG_DIR || path.join(process.cwd(), 'diffLogs');

new Worker('diff-processing', async job => {
  const data = job.data;
  // Ensure log directory exists
  await fs.mkdir(LOG_DIR, { recursive: true });

  if (job.name === 'process-diff') {
    const { owner, repo, commitSha } = data;
    const { data: commitData } = await octokit.rest.repos.getCommit({ owner, repo, commit_sha: commitSha });

    for (const file of commitData.files) {
      if (!file.patch || file.patch.length > MAX_PATCH_LENGTH) continue;
      console.log(`Processing file: ${file.filename} in commit ${commitSha}`);

      // Log diff to a file
      const safeFilename = file.filename.replace(/[\/\\?%*:|"<> ]/g, '_');
      const logFilePath = path.join(LOG_DIR, `${commitSha}_${safeFilename}.diff`);
      await fs.writeFile(logFilePath, file.patch, 'utf8');

      // Store raw diff in Weaviate
      await weaviateClient.data.creator()
        .withClassName('Diff')
        .withProperties({
          commitSha,
          filePath: file.filename,
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch
        })
        .do();
    }

  } else if (job.name === 'process-pull') {
    const { owner, repo, prNumber } = data;
    const { data: files } = await octokit.rest.pulls.listFiles({ owner, repo, pull_number: prNumber });

    for (const file of files) {
      if (!file.patch || file.patch.length > MAX_PATCH_LENGTH) continue;
      console.log(`Processing PR file: ${file.filename} in PR ${prNumber}`);

      const commitSha = `pr-${prNumber}`;
      // Log diff to a file
      const safeFilename = file.filename.replace(/[\/\\?%*:|"<> ]/g, '_');
      const logFilePath = path.join(LOG_DIR, `${commitSha}_${safeFilename}.diff`);
      await fs.writeFile(logFilePath, file.patch, 'utf8');

      await weaviateClient.data.creator()
        .withClassName('Diff')
        .withProperties({
          commitSha,
          filePath: file.filename,
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch
        })
        .do();
    }
  }
}, { connection });
