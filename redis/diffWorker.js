import dotenv from 'dotenv'
import { Worker } from 'bullmq'
import { connection } from '../clients/redisClient.js'
import { Octokit } from 'octokit'
import weaviateClient from '../clients/weaviateClient.js'

dotenv.config()
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

// Threshold to skip overly large diffs
const MAX_PATCH_LENGTH = parseInt(process.env.MAX_PATCH_LENGTH || '10000', 10)

new Worker('diff-processing', async job => {
  const data = job.data
  if (job.name === 'process-diff') {
    const { owner, repo, commitSha } = data
    const { data: commitData } = await octokit.rest.repos.getCommit({ owner, repo, commit_sha: commitSha })
    for (const file of commitData.files) {
      if (!file.patch || file.patch.length > MAX_PATCH_LENGTH) continue
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
        .do()
    }

  } else if (job.name === 'process-pull') {
    const { owner, repo, prNumber } = data
    const { data: files } = await octokit.rest.pulls.listFiles({ owner, repo, pull_number: prNumber })
    for (const file of files) {
      if (!file.patch || file.patch.length > MAX_PATCH_LENGTH) continue
      await weaviateClient.data.creator()
        .withClassName('Diff')
        .withProperties({
          commitSha: `pr-${prNumber}`,
          filePath: file.filename,
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch
        })
        .do()
    }
  }
}, { connection })