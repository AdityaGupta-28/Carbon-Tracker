const Activity = require('../models/Activity');
const User = require('../models/User');
const { ACHIEVEMENTS, CARBON_FACTORS } = require('../utils/achievements');


async function checkAchievementsSilent(userId) {
  try {
    const activities = await Activity.find({ user: userId });
    const user = await User.findById(userId).populate('activities');
    if (!user) return null;

    const unlockedAchievementIds = user.achievements.map(a => a.name);
    const newlyUnlocked = [];

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedAchievementIds.includes(achievement.id)) {
        continue;
      }

      const shouldUnlock = await achievement.check(user, activities);
      
      if (shouldUnlock) {
        user.achievements.push({
          name: achievement.id,
          description: achievement.description,
          icon: achievement.icon
        });
        
        user.achievementPoints += 10;
        
        newlyUnlocked.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon
        });
      }
    }

    await user.save();
    return newlyUnlocked;
  } catch (err) {
    console.error('Error checking achievements:', err);
    return null;
  }
}

exports.logActivity = async (req, res) => {
  try {
    const { type, value, unit, date } = req.body;
    
    
    if (!CARBON_FACTORS.hasOwnProperty(type)) {
      return res.status(400).json({ 
        msg: `Unknown activity type: ${type}. Valid types are: ${Object.keys(CARBON_FACTORS).join(', ')}` 
      });
    }
    
   
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      return res.status(400).json({ msg: 'Value must be a positive number' });
    }
    

    let activityDate = new Date();
    if (date) {
      activityDate = new Date(date);
      if (isNaN(activityDate.getTime())) {
        return res.status(400).json({ msg: 'Invalid date format' });
      }
    }
    
    const activity = new Activity({
      user: req.user,
      type,
      value: numValue,
      unit: unit || 'unit',
      date: activityDate,
    });
    await activity.save();
    await User.findByIdAndUpdate(req.user, { $push: { activities: activity._id } });
    
    
    const newAchievements = await checkAchievementsSilent(req.user);
    
    res.status(201).json({ activity, newlyUnlockedAchievements: newAchievements || [] });
  } catch (err) {
    res.status(500).json({ msg: 'Error logging activity', err });
  }
};
exports.getUserActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching activities', err });
  }
};
exports.calculateCarbon = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user });
    let carbon = 0;
    activities.forEach(act => {
      const factor = CARBON_FACTORS[act.type] ?? 0;
      carbon += act.value * factor;
    });
    res.json({ carbon });
  } catch (err) {
    res.status(500).json({ msg: 'Error calculating carbon', err });
  }
};
exports.leaderboard = async (req, res) => {
  try {
    
    const { CARBON_FACTORS } = require('../utils/achievements');
    
 
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const leaderboard = await Activity.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      {
        $addFields: {
          factor: {
            $switch: {
              branches: [
                { case: { $eq: ['$type', 'transport'] }, then: CARBON_FACTORS.transport },
                { case: { $eq: ['$type', 'electricity'] }, then: CARBON_FACTORS.electricity },
                { case: { $eq: ['$type', 'food'] }, then: CARBON_FACTORS.food },
                { case: { $eq: ['$type', 'flight'] }, then: CARBON_FACTORS.flight },
                { case: { $eq: ['$type', 'biking'] }, then: CARBON_FACTORS.biking },
                { case: { $eq: ['$type', 'recycling'] }, then: CARBON_FACTORS.recycling },
              ],
              default: 0 
            }
          },
        }
      },
      {
        $addFields: { carbon: { $multiply: [ '$value', '$factor' ] } }
      },
      { $group: { _id: '$user', totalCarbon: { $sum: '$carbon' } } },
     
      { $sort: { totalCarbon: 1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users', localField: '_id', foreignField: '_id', as: 'userDoc',
        },
      },
      {
        $project: {
          totalCarbon: 1,
          email: { $arrayElemAt: ['$userDoc.email', 0] },
          name: { $arrayElemAt: ['$userDoc.name', 0] },
        },
      },
   
      { $match: { email: { $ne: null } } },
    ]);
    res.json(leaderboard);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ msg: 'Error fetching leaderboard', err: err.message });
  }
};
