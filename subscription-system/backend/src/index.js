const express = require('express');
const bodyParser = require('body-parser');
const subscriptionRoutes = require('./routes/subscription');

const app = express();
app.use(bodyParser.json());
app.use('/subscription', subscriptionRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Subscription engine running on ${PORT}`));
