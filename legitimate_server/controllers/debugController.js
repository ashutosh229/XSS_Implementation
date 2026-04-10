const sessions = require("../db/sessions");

exports.getSessions = (req, res) => {
  res.json({ active_sessions: sessions });
};
