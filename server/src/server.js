import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const port = process.env.PORT ?? 4000;

mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/taskboard')
  .then(() => app.listen(port, () => console.log(`Task Board API listening on ${port}`)))
  .catch((error) => {
    console.error('Could not connect to MongoDB:', error.message);
    process.exitCode = 1;
  });
