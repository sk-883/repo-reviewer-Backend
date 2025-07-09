import SmeeClient from 'smee-client'

const smee = new SmeeClient({
  source: 'https://smee.io/y9iZzMG5MTPjx0oh',
  target: 'http://localhost:3000/webhook',
  logger: console
})

const events = smee.start()

// Stop forwarding events
events.close()
