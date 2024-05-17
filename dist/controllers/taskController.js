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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.getTasks = exports.createTask = void 0;
const typeorm_1 = require("typeorm");
const Task_1 = require("../models/Task");
const scheduler_1 = require("../services/scheduler");
const class_validator_1 = require("class-validator");
const redis_1 = require("../utils/redis");
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskRepository = (0, typeorm_1.getRepository)(Task_1.Task);
        req.body.startDate = new Date(req.body.startDate);
        req.body.endDate = new Date(req.body.endDate);
        const task = taskRepository.create(req.body);
        console.log("Task :: ", task);
        const errors = yield (0, class_validator_1.validate)(task);
        if (isNaN(req.body.startDate.getTime()) || isNaN(req.body.endDate.getTime()) || req.body.startDate >= req.body.endDate) {
            return res.status(400).json({ message: 'Invalid start or end time. Start time must be before end time and both must be valid dates.' });
        }
        // Validate the time format
        const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(req.body.time)) {
            return res.status(400).json({ message: 'Invalid time format. Time must be in HH:MM format (24-hour clock).' });
        }
        console.log("Errors :: ", errors);
        if (errors.length > 0) {
            return res.status(400).json(errors);
        }
        else {
            yield taskRepository.save(task);
            yield (0, scheduler_1.scheduleTask)(task);
            res.status(201).json(task);
        }
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createTask = createTask;
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskRepository = (0, typeorm_1.getRepository)(Task_1.Task);
        const tasks = yield taskRepository.find();
        res.json(tasks);
    }
    catch (error) {
        console.error('Error retrieving tasks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getTasks = getTasks;
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const taskRepository = (0, typeorm_1.getRepository)(Task_1.Task);
        const task = yield taskRepository.findOne(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        yield (0, scheduler_1.deleteTaskCron)(task.id);
        yield taskRepository.remove(task);
        yield redis_1.redisClient.del(`task:${task.id}`);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.deleteTask = deleteTask;
