import express from 'express';
import { Octokit } from "octokit";


const app = express();
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Parse JSON bodies for webhook payloads
app.post('/webhook', express.json(), async (req, res) => {
  // Acknowledge receipt
  res.sendStatus(202);

  const githubEvent = req.headers['x-github-event'];
  const payload     = req.body;

  // Extract owner/login and repo/name
  const owner = payload.repository.owner.login;
  const repo  = payload.repository.name;

  try {
    if (githubEvent === 'push') {
      // For each commit in the push payload, fetch its full details
      for (const commit of payload.commits) {
        const { data: commitData } = await octokit.repos.getCommit({
          owner,
          repo,
          ref: commit.id
        });

        commitData.files.forEach(file => {
          console.log(
            `[${commit.id.substring(0, 7)}] ${file.filename}: ` +
            `${file.status} (+${file.additions}/-${file.deletions})`
          );
          console.log(file.patch);
        });
      }

    } else if (githubEvent === 'pull_request') {
      // Pull request number comes in payload.number
      const prNumber = payload.number;

      // List changed files in this PR
      const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber
      });

      files.forEach(file => {
        console.log(
          `PR #${prNumber} ${file.filename}: ` +
          `${file.status} (+${file.additions}/-${file.deletions})`
        );
        console.log(file.patch);
      });
    }

    // (You can add other events here…)
  } catch (err) {
    console.error('Error handling webhook:', err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});

