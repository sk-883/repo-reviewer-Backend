#!/usr/bin/env node
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import express from 'express'
import { Octokit } from 'octokit'

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// Load .env
const env = dotenv.config({ path: join(__dirname, '../.env') })
if (env.error) {
  console.error('Failed to load .env:', env.error)
  process.exit(1)
}

const TOKEN = env.parsed.GITHUB_TOKEN
const PORT  = env.parsed.PORT || 3000

const app     = express()
const octokit = new Octokit({ auth: TOKEN })

app.post('/webhook', express.json(), async (req, res) => {
  res.sendStatus(202)

  const event   = req.headers['x-github-event']
  const payload = req.body
  const owner   = payload.repository.owner.login
  const repo    = payload.repository.name
  await new Promise(resolve => setTimeout(resolve, 2000)) 
  console.log(payload)
  
  try {
    if (event === 'push') {
      for (const commit of payload.commits) {
        // 🔑 Use `ref` to hit /commits/{ref}
        const { data: commitData } = await octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: commit.id
        })

        commitData.files.forEach(file => {
          console.log(
            `[${commit.id.substring(0,7)}] ${file.filename}: ` +
            `${file.status} (+${file.additions}/-${file.deletions})`
          )
          console.log(file.patch)
        })
      }

    } else if (event === 'pull_request') {
      const prNumber = payload.pull_request.number

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
  console.log(`Listening on port ${PORT}`)
})
