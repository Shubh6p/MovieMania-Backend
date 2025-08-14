const Movie = require('../models/Movies');
const Series = require('../models/Series');
const Admin = require('../models/Admins');
const Session = require('../models/Sessions');

exports.getStats = async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    const [totalMovies, totalSeries, totalAdmins, recentSessions] = await Promise.all([
      Movie.countDocuments(),
      Series.countDocuments(),
      Admin.countDocuments(),
      Session.countDocuments({ createdAt: { $gte: since } }) // Recent logins in the last 7 days
    ]);
    res.json({
      totalMovies,
      totalSeries,
      totalAdmins,
      recentLogins: recentSessions
    });
  } catch (e) {
    console.error('❌ Error fetching analytics:', e);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
};
