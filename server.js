const express = require('express')
const cors = require('cors')
const logger = require('morgan')
const amqp = require('amqp-connection-manager')

const amqplib = require('amqplib')
async function RabbitMQ() {
  const queue = 'q.sing.service'
  const conn = await amqplib.connect('amqp://rabbitmq:1jj395qu@localhost:5672')

  const ch1 = await conn.createChannel()
    await ch1.assertQueue(queue)
    await ch1.assertExchange('ex.sing', 'fanout', { durable: true })

  // Listener
  ch1.consume(queue, (msg) => {
    if (msg !== null) {
      console.log('Received:', msg.content.toString())
      ch1.ack(msg)
    } else {
      console.log('Consumer cancelled by server')
    }
  })

  // Sender
    ch1.bindQueue(queue, 'ex.sing', '')

}

// RabbitMQ()

async function connectRabbitMQ() {
  const connection = amqp.connect('amqp://rabbitmq:1jj395qu@localhost:5672')

  connection.on('connect', () => console.log('RabbitMQ Connected!'))
  connection.on('disconnect', (err) => console.log('RabbitMQ Disconnected.', err.stack))
  // Create a channel wrapper
  const channelWrapper = connection.createChannel({
    // json: true,
    setup: function (channel) {
      return channel
    },
  })
  return channelWrapper
}

async function main() {
  const app = express()

  // connect RabbitMQ and create exchange
  const channel = await connectRabbitMQ()
  await channel.assertExchange('ex.sing', 'fanout', { durable: true })
  // send data User to product-server
  await channel.assertQueue('q.sing.service', { durable: true })
  await channel.bindQueue('q.sing.service', 'ex.sing', '')

  channel.consume('q.node.service', (msg) => {
    if (msg !== null) {
      console.log(msg.content.toString())
      console.info(msg.properties.type)
      channel.ack(msg)
    } else {
      console.error('No message received')
    }
  })

  app.use(cors())

  app.use(logger('dev'))
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  app.get('/', (req, res) => {
    const newUser = {
      id: 1,
      name: 'Sing',
      message: 'Hello World!',
    }

    channel.publish('ex.sing', '', Buffer.from(JSON.stringify(newUser)), {
      contentType: 'application/json',
      contentEncoding: 'utf-8',
      type: 'service-get',
      persistent: true,
    })

    res.send('Hello World!')
  })

  app.listen(3000, () => console.log('Server is running on port 3000'))
}

main()
