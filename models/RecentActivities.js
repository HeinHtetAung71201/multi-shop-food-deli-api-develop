const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  action: String, // e.g., "Created User", "Deleted Order"
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who did it
  target: String, // target info (e.g., user name, order ID)
  timestamp: { type: Date, default: Date.now },
  metadata: Object, // optional details
});

module.exports = mongoose.model('Activity', activitySchema);
