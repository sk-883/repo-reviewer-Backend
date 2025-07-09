#!/usr/bin/env node
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })

import SmeeClient from 'smee-client'

const URL = process.env.WEBHOOK_PROXY_URL

console.log('Using Smee URL:', URL)

const smee = new SmeeClient({
  source: URL,
  target: 'http://localhost:3000/webhook',
  logger: console
})

const events = smee.start()

process.on('SIGINT', () => {
  console.log('Closing Smee clien')
  events.close()
  process.exit()
})
