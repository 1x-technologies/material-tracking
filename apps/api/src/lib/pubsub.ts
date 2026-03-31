import { PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub();

export async function publishEvent(topicName: string, data: Record<string, unknown>): Promise<string> {
  const topic = pubsub.topic(topicName);
  const messageId = await topic.publishMessage({
    json: data,
  });
  return messageId;
}

export const Topics = {
  SHIPMENT_CREATED: 'shipment-created',
  PIECE_SCANNED: 'piece-scanned',
  NOTIFICATION_SEND: 'notification-send',
} as const;
