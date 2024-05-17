import Redis from 'ioredis';

export const redisClient = new Redis({
  host: 'localhost', // Replace with your Redis server host
  port: 6379,        // Replace with your Redis server port
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redisClient.on('connect', () => {
  console.log('Connected to Redis.');
});

redisClient.on('error', (error : any) => {
  console.error('Redis connection error:', error);
});
