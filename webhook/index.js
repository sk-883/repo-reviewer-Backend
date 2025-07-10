import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import express from 'express'
import { Octokit } from 'octokit'
import { diffQueue } from '../redis/redisClient.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })
const TOKEN = process.env.GITHUB_TOKEN
const PORT  = process.env.PORT || 3000

const app     = express()
const octokit = new Octokit({ auth: TOKEN })

app.post('/webhook', express.json(), async (req, res) => {
  res.sendStatus(202)
  const event   = req.headers['x-github-event']
  const payload = req.body

  if (event === 'push') {
    const { repository, commits } = payload
    const owner = repository.owner.login
    const repo  = repository.name
    let count=0;
    for (const commit of commits) {
      console.log("commit count, "(++count)+"/n")
      console.log(commit)
      await diffQueue.add('process-diff', { owner, repo, commitSha: commit.id })
    }

  } else if (event === 'pull_request') {
    const { repository, pull_request } = payload
    const owner    = repository.owner.login
    const repo     = repository.name
    const prNumber = pull_request.number

    // Enqueue the pull request for file processing
    await diffQueue.add('process-pull', { owner, repo, prNumber })
  }
})

app.listen(PORT, () => console.log(`Webhook listener on port ${PORT}`))