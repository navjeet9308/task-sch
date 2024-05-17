import express from 'express';
import { json } from 'body-parser';
import { connectDatabase } from './utils/database';
import { createTask, getTasks, deleteTask } from './controllers/taskController';
import { loadAndScheduleAllTasks } from './services/scheduler';

const app = express();
app.use(json());

app.post('/tasks', createTask);
app.get('/tasks', getTasks);
app.delete('/tasks/:id', deleteTask);
connectDatabase().then(async () => {
    console.log('connected..');
    await loadAndScheduleAllTasks(); // Load and schedule tasks on startup

 }).catch(error => {
  console.error('Database connection failed:', error);
});

export default app;
