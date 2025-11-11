const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/achievementsController');

router.get('/', auth, ctrl.getAchievements);
router.get('/all', auth, ctrl.getAllAchievements);
router.post('/check', auth, ctrl.checkAchievements);

module.exports = router;

