#!/usr/bin/env node
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import express from 'express'
import { Octokit } from 'octokit'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// load .env
const envResult = dotenv.config({ path: join(__dirname, '../.env') })
if (envResult.error) {
  console.error('Error loading .env:', envResult.error)
  process.exit(1)
}

const TOKEN = envResult.parsed.GITHUB_TOKEN
const PORT  = envResult.parsed.PORT || 3000

const app     = express()
const octokit = new Octokit({ auth: TOKEN })

app.post('/webhook', express.json(), async (req, res) => {
  res.sendStatus(202)
  
  console.log('Received webhook event:', req.headers['x-github-event'])
  await new Promise(resolve=>setTimeout(resolve, 10000)) 
  

  const githubEvent = req.headers['x-github-event']
  const payload     = req.body
  const owner       = payload.repository.owner.login
  const repo        = payload.repository.name

  try {
    if (githubEvent === 'push') {
      for (const commit of payload.commits) {
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
      const prNumber = payload.pull_request?.number ?? payload.number

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

  } catch (err) {
    console.error('Error handling webhook:', err)
  }
})

app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`)
})
