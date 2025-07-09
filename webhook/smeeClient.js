import SmeeClient from 'smee-client'

const smee = new SmeeClient({
  source: process.env.WEBHOOK_PROXY_URL,
  target: 'http://localhost:3000/webhook',
  logger: console
})

const events = smee.start()

// Stop forwarding events
events.close()
