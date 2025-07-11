// // src/webhook.js
// import dotenv from 'dotenv'
// import { fileURLToPath } from 'url'
// import { dirname, join } from 'path'
// import express from 'express'
// import { Octokit } from 'octokit'
// import { diffQueue } from '../redis/redisClient.js'
// import { weaviateClient } from '../weaviatedb/weaviateClient.js'

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

// dotenv.config({ path: join(__dirname, '../.env') })
// const TOKEN = process.env.GITHUB_TOKEN
// const PORT = process.env.PORT || 3000

// const app = express()
// const octokit = new Octokit({ auth: TOKEN })

// app.post('/webhook', express.json(), async (req, res) => {
//   res.sendStatus(202)
//   const event = req.headers['x-github-event']
//   const payload = req.body

//   if (event === 'push') {
//     const { repository, commits } = payload
//     const owner = repository.owner.login
//     const repo = repository.name

//     try {
//       for (const commit of commits) {
//         console.log(`Commit ID: ${commit.id}  Repository: ${repo}`)

//         // fetch counts instead of getJobs()
//         // const waiting   = await diffQueue.getWaitingCount()
//         // const active    = await diffQueue.getActiveCount()
//         // const completed = await diffQueue.getCompletedCount()
//         // const failed    = await diffQueue.getFailedCount()
//         // console.log(
//         //   `Queue status — waiting: ${waiting}, active: ${active}, completed: ${completed}, failed: ${failed}`
//         // )

//         // enqueue the diff job
//         // await diffQueue.add('process-diff', { owner, repo, commitSha: commit.id })
//         const { data: commitData } = await octokit.rest.repos.getCommit({ owner, repo, commit_sha: commit.id });



//         console.log(commitData)
//         commitData.files.forEach(file => {
//           if (file.patch && file.patch.length < MAX_PATCH_LENGTH) {
//             console.log(
//               `[${commit.id.substring(0, 7)}] ${file.filename}: ` +
//               `${file.status} (+${file.additions}/-${file.deletions})`
//             )
//             console.log(file.patch)
//           }

//         })






//         for (const file of data.files) {
//           if (!file.patch || file.patch.length > MAX_PATCH_LENGTH) continue
//           // Store raw diff in Weaviate
//           const sha = commit.id;
//           console.log("inside for loop")
//           console.log(`Processing file: ${file.filename} in commit ${commit.id}`)
//           console.log(`Additions: ${file.additions}, Deletions: ${file.deletions}, Patch length: ${file.patch.length}`)
//           await weaviateClient.data.creator()
//             .withClassName('Diff')
//             .withProperties({
//               sha,
//               filePath: file.filename,
//               additions: file.additions,
//               deletions: file.deletions,
//               patch: file.patch
//             })
//             .do()
//         }
//         console.log(`Enqueued job process-diff for ${commit.id}`)
//       }
//     } catch (err) {
//       console.error('Error in /webhook handler:', err)
//     }
//   }
//   else if (event === 'pull_request') {
//     const { repository, pull_request } = payload
//     const owner = repository.owner.login
//     const repo = repository.name
//     const prNumber = pull_request.number

//     try {
//       await diffQueue.add('process-pull', { owner, repo, prNumber })
//       console.log(`Enqueued job process-pull for PR #${prNumber}`)
//     } catch (err) {
//       console.error('Failed to enqueue process-pull:', err)
//     }
//   }
// })

// app.listen(PORT, () => console.log(`Webhook listener running on port ${PORT}`))


import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import express from 'express'
import { Octokit } from '@octokit/rest'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })
const TOKEN = process.env.GITHUB_TOKEN
const PORT  = process.env.PORT || 3000

const app     = express()
const octokit = new Octokit({ auth: TOKEN })

app.post('/webhook', express.json(), async (req, res) => {
  res.sendStatus(202)
  const { repository, commits, pull_request } = req.body
  const owner = repository?.owner?.login
  const repo  = repository?.name

  try {
    const event = req.headers['x-github-event']
    if (event === 'push') {
      for (const commit of commits) {
        const { data: commitData } = await octokit.rest.repos.getCommit({
          owner,
          repo,
          commit_sha: commit.id
        })

        if (!commitData.files) {
          console.warn(`No files array on commit ${commit.id}`)
          continue
        }

        for (const file of commitData.files) {
          console.log(
            `[${commit.id.substring(0,7)}] ${file.filename}: ` +
            `${file.status} (+${file.additions}/-${file.deletions})`
          )
          console.log(file.patch)
        }
      }
    } else if (event === 'pull_request') {
      const prNumber = pull_request.number
      const { data: files } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber
      })

      for (const file of files) {
        console.log(
          `PR #${prNumber} ${file.filename}: ` +
          `${file.status} (+${file.additions}/-${file.deletions})`
        )
        console.log(file.patch)
      }
    }
  } catch (error) {
    console.error('Error handling webhook:', error)
  }
})

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})

