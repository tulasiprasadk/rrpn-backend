const express = require('express');
const router = express.Router();
const controller = require('../controllers/subscriptionController');

router.post('/create', controller.create);
router.put('/update/:id', controller.update);
router.post('/pause/:id', controller.pause);
router.post('/skip/:id', controller.skip);
router.get('/recommendations', controller.recommendations);

module.exports = router;
