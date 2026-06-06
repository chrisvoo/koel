import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import config from '../config.mjs';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export default class PlaybackStateManager {
  constructor(userId) {
    this.userId = userId;
    this.tableName = config.dynamoTableName;
  }

  async getState() {
    const result = await docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { userId: this.userId },
    }));

    return result.Item || this.defaultState();
  }

  async saveState(state) {
    await docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        userId: this.userId,
        ...state,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  defaultState() {
    return {
      userId: this.userId,
      queue: [],
      currentIndex: 0,
      offsetInMilliseconds: 0,
      shuffle: false,
      loop: false,
    };
  }

  static buildQueue(songs, baseUrl, audioToken) {
    return songs.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist_name,
      album: song.album_name,
      albumCover: song.album_cover,
      length: song.length,
      url: `${baseUrl}/play/${song.id}?t=${audioToken}`,
      token: song.id,
    }));
  }

  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
