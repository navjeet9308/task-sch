import cron from 'node-cron';
import { getRepository } from 'typeorm';
import { Task } from '../models/Task';
import { redisClient } from '../utils/redis';
import axios from 'axios';
import Redlock from 'redlock';

const redlock = new Redlock([redisClient]);
const scheduledJobs: Map<number, cron.ScheduledTask> = new Map();

export const scheduleTask = async (task: any) => {
  const jobKey = `task:${task.id}`;
  const lockKey = `lock:task:${task.id}`;
  const startDate = new Date(task.startDate);
  const endDate = new Date(task.endDate);
  let executionCount = 0;

  const schedule = (cronTime: string) => {
    const job = cron.schedule(cronTime, async () => {
      const now = new Date();

      if (now >= startDate && now <= endDate) {
        const lock = await redlock.acquire([lockKey], 1000); // Acquire lock with 1 second TTL
        try {
          // Check the limit
          if (executionCount < task.limit) {
            console.log(`Executing Task: ${task.name} at ${now}`);
            executionCount++;

            // Persist execution count
            await redisClient.set(`${jobKey}:count`, executionCount.toString());
          } else {
            console.log(`Task limit reached for ${task.name}`);
            stopScheduledTask(task.id); // Stop the scheduled task
          }
        } catch (error) {
          console.error('Error executing task:', error);
        } finally {
          await lock.release(); // Release lock
        }
      } else {
        console.log(`Current time ${now} is out of the task's scheduled date range.`);
      }
    });
    
    // Store the scheduled job
    scheduledJobs.set(task.id, job);
  };

  let cronTime = '';

  try {
    if (task.time === 'sunrise' || task.time === 'sunset') {
      const [latitude, longitude] = task.locale.split(',').map(Number);
      const response = await axios.get(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`);
      const time = task.time === 'sunrise' ? response.data.results.sunrise : response.data.results.sunset;
      const date = new Date(time);
      cronTime = `${date.getUTCMinutes()} ${date.getUTCHours()} * * *`;
    } else {
      const [hour, minute] = task.time.split(':').map(Number);
      cronTime = `${minute} ${hour} * * *`;
    }

    // Initialize execution count from Redis if exists
    const storedCount = await redisClient.get(`${jobKey}:count`);
    if (storedCount) {
      executionCount = parseInt(storedCount, 10);
    }

    schedule(cronTime);
    await redisClient.set(jobKey, cronTime);
  } catch (error) {
    console.error('Error scheduling task:', error);
  }
};

export const loadAndScheduleAllTasks = async () => {
  try {
    console.log("Loading Tasks");
    const taskRepository = getRepository(Task);
    const tasks = await taskRepository.find();

    for (const task of tasks) {
      await scheduleTask(task);
    }

    console.log("Tasks loaded and scheduled successfully.");
  } catch (error) {
    console.error('Error loading and scheduling tasks:', error);
  }
};

export const deleteTaskCron = async (taskId: number) => {
  try {
    // Remove the scheduled job if exists
    stopScheduledTask(taskId);
    console.log(`Task with ID ${taskId} deleted successfully.`);
  } catch (error) {
    console.error('Error deleting task:', error);
  }
};

const stopScheduledTask = (taskId: number) => {
  const scheduledJob = scheduledJobs.get(taskId);
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJobs.delete(taskId);
    console.log(`Scheduled task with ID ${taskId} stopped.`);
  }
};
