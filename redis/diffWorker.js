import dotenv from 'dotenv'
import { Worker } from 'bullmq'
import { connection } from './redisClient.js'
import { Octokit } from 'octokit'
import weaviateClient from '../weaviatedb/weaviateClient.js'

dotenv.config()
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

// Threshold to skip overly large diffs
const MAX_PATCH_LENGTH = parseInt(process.env.MAX_PATCH_LENGTH || '10000', 10)

console.log("Worker logs, outside job processing")
new Worker('diff-processing', async job => {
console.log("Worker logs, inside job processing")

  const data = job.data
  if (job.name === 'process-diff') {
    const { owner, repo, commitSha } = data
    const { data: commitData } = await octokit.rest.repos.getCommit({ owner, repo, commit_sha: commitSha })
    for (const file of commitData.files) {
      if (!file.patch || file.patch.length > MAX_PATCH_LENGTH) continue
      // Store raw diff in Weaviate
      console.log(`Processing file: ${file.filename} in commit ${commitSha}`)
      console.log(`Additions: ${file.additions}, Deletions: ${file.deletions}, Patch length: ${file.patch.length}`)
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