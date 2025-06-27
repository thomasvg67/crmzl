const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
// app.use(cors());
app.use(cors({
  origin: 'https://crm.zoomlabs.in', // or use '*' for testing (not for production)
  credentials: true // if using cookies or auth headers
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));
app.use('/uploads/pdfs', express.static(path.join(__dirname, 'uploads/pdfs')));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
  
// Routes
app.use('/api/notes', require('./routes/notes'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/feedbacks', require('./routes/FdBack'));
app.use('/api/users', require('./routes/users'));
app.use('/api/scrum-board', require('./routes/scrumBoardRoutes'));


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
