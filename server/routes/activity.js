const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/activityController');
router.post('/log', auth, ctrl.logActivity);
router.get('/user', auth, ctrl.getUserActivities);
router.get('/carbon', auth, ctrl.calculateCarbon);
router.get('/leaderboard', auth, ctrl.leaderboard);
module.exports = router;
