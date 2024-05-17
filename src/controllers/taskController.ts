import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Task } from '../models/Task';
import { scheduleTask, deleteTaskCron } from '../services/scheduler';

import { validate } from 'class-validator';
import { redisClient } from '../utils/redis';


export const createTask = async (req: Request, res: Response) => {
  try {
    const taskRepository = getRepository(Task);

    req.body.startDate = new Date(req.body.startDate)
    req.body.endDate = new Date(req.body.endDate)
    const task = taskRepository.create(req.body);
    console.log("Task :: ", task)
    const errors = await validate(task);

    if (isNaN(req.body.startDate.getTime()) || isNaN(req.body.endDate.getTime()) || req.body.startDate >= req.body.endDate) {
      return res.status(400).json({ message: 'Invalid start or end time. Start time must be before end time and both must be valid dates.' });
    }

    // Validate the time format
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(req.body.time)) {
      return res.status(400).json({ message: 'Invalid time format. Time must be in HH:MM format (24-hour clock).' });
    }
    console.log("Errors :: ", errors)
    if (errors.length > 0) {  
      return res.status(400).json(errors);
    } else {
      await taskRepository.save(task);
      await scheduleTask(task);
      
      res.status(201).json(task);
    }

    
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const taskRepository = getRepository(Task);
    const tasks = await taskRepository.find();
    res.json(tasks);
  } catch (error) {
    console.error('Error retrieving tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const taskRepository = getRepository(Task);
    const task = await taskRepository.findOne(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await deleteTaskCron(task.id)
    await taskRepository.remove(task);
    await redisClient.del(`task:${task.id}`);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
