const router = require('express').Router();
router.get('/', (req, res) => {
  res.json({
    suggestions: [
      'Use public transport instead of driving.',
      'Switch to LED bulbs.',
      'Eat less red meat.',
      'Dry clothes in sunlight, not a dryer.',
      'Use reusable water bottle.',
      'Turn off electricals when not in use.'
    ]
  });
});
module.exports = router;
