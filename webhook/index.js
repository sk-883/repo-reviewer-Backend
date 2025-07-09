#!/usr/bin/env node
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import express from 'express'
import { Octokit } from 'octokit'

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// Load environment variables
const envResult = dotenv.config({ path: join(__dirname, '../.env') })
if (envResult.error) {
  console.error('Error loading .env:', envResult.error)
  process.exit(1)
}

const TOKEN = envResult.parsed.GITHUB_TOKEN
const PORT  = envResult.parsed.PORT || 3000

// Initialize Express and Octokit
const app     = express()
const octokit = new Octokit({ auth: TOKEN })

// Webhook endpoint
app.post('/webhook', express.json(), async (req, res) => {
  // Acknowledge immediately
  res.sendStatus(202)

  const githubEvent = req.headers['x-github-event']
  const payload     = req.body
  const owner       = payload.repository.owner.login
  const repo        = payload.repository.name

  try {
    if (githubEvent === 'push') {
      for (const commit of payload.commits) {
        // Fetch full commit details, including file diffs
        const { data: commitData } = await octokit.rest.repos.getCommit({
          owner,
          repo,
          commit_sha: commit.id
        })

        commitData.files.forEach(file => {
          console.log(
            `[${commit.id.substring(0,7)}] ${file.filename}: ` +
            `${file.status} (+${file.additions}/-${file.deletions})`
          )
          console.log(file.patch)
        })
      }

    } else if (githubEvent === 'pull_request') {
      const prNumber = payload.pull_request.number

      // List changed files in the PR
      const { data: files } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber
      })

      files.forEach(file => {
        console.log(
          `PR #${prNumber} ${file.filename}: ` +
          `${file.status} (+${file.additions}/-${file.deletions})`
        )
        console.log(file.patch)
      })
    }

    // You can handle more events here...

  } catch (err) {
    console.error('Error handling webhook:', err)
  }
})

// Start the server
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`)
})
