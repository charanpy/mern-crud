const express = require('express');
const cors = require('cors');
const app = express();

app.use(
  cors({
    origin: '*',
  })
);
const connectDB = require('./config/db');
const PORT = process.env.PORT;
connectDB();
const user = require('./routes/api/user');
const auth = require('./routes/api/auth');
const profile = require('./routes/api/profile');
const post = require('./routes/api/post');
//
app.use(express.json({ extended: true }));
//Routers
app.use('/api/users', user);
app.use('/api/auth', auth);
app.use('/api/profile', profile);
app.use('/api/post', post);

app.listen(PORT || 3001, () => {
  console.log('Started');
});
