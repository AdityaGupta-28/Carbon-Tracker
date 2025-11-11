const User = require('../models/User');
const Activity = require('../models/Activity');
const { ACHIEVEMENTS } = require('../utils/achievements');


exports.getAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user.achievements);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching achievements', err });
  }
};


exports.checkAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const activities = await Activity.find({ user: req.user });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

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

    res.json({
      newlyUnlocked,
      achievements: user.achievements,
      achievementPoints: user.achievementPoints
    });
  } catch (err) {
    res.status(500).json({ msg: 'Error checking achievements', err });
  }
};


exports.getAllAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const activities = await Activity.find({ user: req.user });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const unlockedAchievementIds = user.achievements.map(a => a.name);
    const userUnlocked = user.achievements.map(a => a.name);

    const allAchievements = await Promise.all(
      ACHIEVEMENTS.map(async (achievement) => {
        const isUnlocked = unlockedAchievementIds.includes(achievement.id);
        const progress = await achievement.check(user, activities);
        
        return {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          isUnlocked,
          progress: progress ? 100 : 0
        };
      })
    );

    res.json({
      achievements: allAchievements,
      totalAchievements: ACHIEVEMENTS.length,
      unlockedCount: user.achievements.length,
      achievementPoints: user.achievementPoints
    });
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching all achievements', err });
  }
};

