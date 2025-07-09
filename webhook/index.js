// server.js
import express from 'express';
const app = express();

// Parse JSON payloads for GitHub Webhooks
app.post(
  '/webhook',
  express.json({ type: 'application/json' }),
  (req, res) => {
    res.status(202).send('Accepted'); // Acknowledge within 10s (GitHub requirement)

    const githubEvent = req.headers['x-github-event'];
    const payload = req.body;

    switch (githubEvent) {
      case 'push':
        // Fired on any git push (including merges)
        console.log(`Push to ${payload.ref} by ${payload.pusher.name}`); 
        console.log(`Commits (${payload.commits.length}):`);
        console.log('___________________________________________')
        console.log(payload)
        payload.commits.forEach(commit => {
          console.log(`- ${commit.id.substring(0,7)}: "${commit.message}" by ${commit.author.name}`);
        });
        break;

      case 'pull_request':
        const action = payload.action;
        const pr = payload.pull_request;
        if (action === 'opened') {
          console.log(`PR opened (#${payload.number}): ${pr.title}`);
        } else if (action === 'closed') {
          if (pr.merged) {
            console.log(`PR merged (#${payload.number}) by ${pr.merged_by.login}`);
          } else {
            console.log(`PR closed without merge (#${payload.number})`);
          }
        } else if (action === 'reopened') {
          console.log(`PR reopened (#${payload.number}): ${pr.title}`);
        } else {
          console.log(`Unhandled pull_request action: ${action}`);
        }
        break;

      case 'issues':
        // existing logic...
        const issueAction = payload.action;
        if (issueAction === 'opened') {
          console.log(`Issue opened: ${payload.issue.title}`);
        } else if (issueAction === 'closed') {
          console.log(`Issue closed by ${payload.issue.user.login}`);
        } else {
          console.log(`Unhandled issues action: ${issueAction}`);
        }
        break;

      case 'ping':
        console.log('Received ping event');
        break;

      default:
        console.log(`Unhandled event type: ${githubEvent}`);
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook listener running on port ${PORT}`);
});
