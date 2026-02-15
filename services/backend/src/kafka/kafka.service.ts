import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly consumer: Consumer;
  private readonly handlers = new Map<string, (message: any) => Promise<void>>();

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

    this.kafka = new Kafka({
      clientId: 'ecommerce-backend',
      brokers,
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'ecommerce-backend-group' });
  }

  async onModuleInit(): Promise<void> {
    await this.producer.connect();
    this.logger.log('Kafka producer connected');

    await this.consumer.connect();
    this.logger.log('Kafka consumer connected');

    await this.consumer.subscribe({ topics: ['settlement-retry', 'refund-retry'], fromBeginning: false });
    this.logger.log('Subscribed to topics: settlement-retry, refund-retry');

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const value = JSON.parse(message.value?.toString() || '{}');
          const handler = this.handlers.get(topic);

          if (handler) {
            await handler(value);
          } else {
            this.logger.warn(`No handler registered for topic: ${topic}`);
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Error processing message from topic ${topic}: ${errorMsg}`);
        }
      },
    });

    this.logger.log('Kafka consumer is running');
  }

  registerHandler(topic: string, handler: (value: any) => Promise<void>): void {
    this.handlers.set(topic, handler);
    this.logger.log(`Handler registered for topic: ${topic}`);
  }

  async produce(topic: string, value: object): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          key: null,
          value: JSON.stringify(value),
        },
      ],
    });
    this.logger.log(`Message produced to topic: ${topic}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.producer.disconnect();
    this.logger.log('Kafka producer disconnected');

    await this.consumer.disconnect();
    this.logger.log('Kafka consumer disconnected');
  }
}
