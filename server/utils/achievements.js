

const CARBON_FACTORS = {
  transport: 0.21,     
  electricity: 0.475,  
  food: 2.5,            
  flight: 0.13,         
  biking: 0.01,         
  recycling: -0.2,      
};


const ACHIEVEMENTS = [
  {
    id: 'first_activity',
    name: 'Getting Started',
    description: 'Log your first activity',
    icon: '🚀',
    check: async (user, activities) => activities.length >= 1
  },
  {
    id: 'biker_rookie',
    name: 'Biker Rookie',
    description: 'Bike 10 km',
    icon: '🚴',
    check: async (user, activities) => {
      const bikeKm = activities
        .filter(a => a.type === 'biking')
        .reduce((sum, a) => sum + a.value, 0);
      return bikeKm >= 10;
    }
  },
  {
    id: 'biker_champ',
    name: 'Biker Champion',
    description: 'Bike 100 km',
    icon: '🚵',
    check: async (user, activities) => {
      const bikeKm = activities
        .filter(a => a.type === 'biking')
        .reduce((sum, a) => sum + a.value, 0);
      return bikeKm >= 100;
    }
  },
  {
    id: 'eco_warrior',
    name: 'Eco Warrior',
    description: 'Complete 10 eco-friendly activities',
    icon: '🛡️',
    check: async (user, activities) => {
      const ecoActivities = activities.filter(a => 
        ['biking', 'recycling'].includes(a.type)
      );
      return ecoActivities.length >= 10;
    }
  },
  {
    id: 'carbon_conscious',
    name: 'Carbon Conscious',
    description: 'Reduce carbon by 50 kg',
    icon: '🌱',
    check: async (user, activities) => {
      const totalCarbon = activities.reduce((sum, act) => {
        const factor = CARBON_FACTORS[act.type] ?? 0;
        return sum + (act.value * factor);
      }, 0);
      return totalCarbon <= -50;
    }
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Log activities for 7 consecutive days',
    icon: '🔥',
    check: async (user, activities) => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentActivities = activities.filter(a => new Date(a.date) >= sevenDaysAgo);
      return recentActivities.length >= 7;
    }
  },
  {
    id: 'recycling_master',
    name: 'Recycling Master',
    description: 'Recycle 50 kg of materials',
    icon: '♻️',
    check: async (user, activities) => {
      const recycled = activities
        .filter(a => a.type === 'recycling')
        .reduce((sum, a) => sum + a.value, 0);
      return recycled >= 50;
    }
  },
  {
    id: 'zero_carbon',
    name: 'Zero Carbon Hero',
    description: 'Achieve net zero carbon footprint',
    icon: '🌍',
    check: async (user, activities) => {
      const totalCarbon = activities.reduce((sum, act) => {
        const factor = CARBON_FACTORS[act.type] ?? 0;
        return sum + (act.value * factor);
      }, 0);
      return totalCarbon <= 0 && activities.length > 0;
    }
  }
];

module.exports = {
  ACHIEVEMENTS,
  CARBON_FACTORS
};

