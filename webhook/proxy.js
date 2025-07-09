#!/usr/bin/env node
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

const envResult = dotenv.config({ path: join(__dirname, '../.env') });
const URL= envResult.parsed.WEBHOOK_PROXY_URL;


import SmeeClient from 'smee-client'

console.log( URL)

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
