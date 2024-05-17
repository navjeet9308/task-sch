"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTaskCron = exports.loadAndScheduleAllTasks = exports.scheduleTask = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const typeorm_1 = require("typeorm");
const Task_1 = require("../models/Task");
const redis_1 = require("../utils/redis");
const axios_1 = __importDefault(require("axios"));
const redlock_1 = __importDefault(require("redlock"));
const redlock = new redlock_1.default([redis_1.redisClient]);
const scheduledJobs = new Map();
const scheduleTask = (task) => __awaiter(void 0, void 0, void 0, function* () {
    const jobKey = `task:${task.id}`;
    const lockKey = `lock:task:${task.id}`;
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    let executionCount = 0;
    const schedule = (cronTime) => {
        const job = node_cron_1.default.schedule(cronTime, () => __awaiter(void 0, void 0, void 0, function* () {
            const now = new Date();
            if (now >= startDate && now <= endDate) {
                const lock = yield redlock.acquire([lockKey], 1000); // Acquire lock with 1 second TTL
                try {
                    // Check the limit
                    if (executionCount < task.limit) {
                        console.log(`Executing Task: ${task.name} at ${now}`);
                        executionCount++;
                        // Persist execution count
                        yield redis_1.redisClient.set(`${jobKey}:count`, executionCount.toString());
                    }
                    else {
                        console.log(`Task limit reached for ${task.name}`);
                        stopScheduledTask(task.id); // Stop the scheduled task
                    }
                }
                catch (error) {
                    console.error('Error executing task:', error);
                }
                finally {
                    yield lock.release(); // Release lock
                }
            }
            else {
                console.log(`Current time ${now} is out of the task's scheduled date range.`);
            }
        }));
        // Store the scheduled job
        scheduledJobs.set(task.id, job);
    };
    let cronTime = '';
    try {
        if (task.time === 'sunrise' || task.time === 'sunset') {
            const [latitude, longitude] = task.locale.split(',').map(Number);
            const response = yield axios_1.default.get(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`);
            const time = task.time === 'sunrise' ? response.data.results.sunrise : response.data.results.sunset;
            const date = new Date(time);
            cronTime = `${date.getUTCMinutes()} ${date.getUTCHours()} * * *`;
        }
        else {
            const [hour, minute] = task.time.split(':').map(Number);
            cronTime = `${minute} ${hour} * * *`;
        }
        // Initialize execution count from Redis if exists
        const storedCount = yield redis_1.redisClient.get(`${jobKey}:count`);
        if (storedCount) {
            executionCount = parseInt(storedCount, 10);
        }
        schedule(cronTime);
        yield redis_1.redisClient.set(jobKey, cronTime);
    }
    catch (error) {
        console.error('Error scheduling task:', error);
    }
});
exports.scheduleTask = scheduleTask;
const loadAndScheduleAllTasks = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Loading Tasks");
        const taskRepository = (0, typeorm_1.getRepository)(Task_1.Task);
        const tasks = yield taskRepository.find();
        for (const task of tasks) {
            yield (0, exports.scheduleTask)(task);
        }
        console.log("Tasks loaded and scheduled successfully.");
    }
    catch (error) {
        console.error('Error loading and scheduling tasks:', error);
    }
});
exports.loadAndScheduleAllTasks = loadAndScheduleAllTasks;
const deleteTaskCron = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Remove the scheduled job if exists
        stopScheduledTask(taskId);
        console.log(`Task with ID ${taskId} deleted successfully.`);
    }
    catch (error) {
        console.error('Error deleting task:', error);
    }
});
exports.deleteTaskCron = deleteTaskCron;
const stopScheduledTask = (taskId) => {
    const scheduledJob = scheduledJobs.get(taskId);
    if (scheduledJob) {
        scheduledJob.stop();
        scheduledJobs.delete(taskId);
        console.log(`Scheduled task with ID ${taskId} stopped.`);
    }
};
