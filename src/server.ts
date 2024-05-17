import app from './app';
import { loadAndScheduleAllTasks } from './services/scheduler';

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server.TS is running on port ${PORT}`);
}).on('error', (error) => {
  console.error('Server error:', error);
});
