const Session = require('../models/sessionModel');
const { ZOOM_MAX_CONCURRENT } = require('../config/constants');

/**
 * Sum confirmed enrollments across all Zoom sessions overlapping [start, end).
 */
async function countConcurrentZoomParticipants(startTime, endTime, excludeSessionId) {
  const filter = {
    isZoom: true,
    status: 'scheduled',
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeSessionId) filter._id = { $ne: excludeSessionId };

  const sessions = await Session.find(filter).select('enrolledClients');
  return sessions.reduce((sum, s) => sum + (s.enrolledClients?.length || 0), 0);
}

/** Confirmed enrollments only; excludes this session from the "others" sum, then adds this session's roster + 1 new seat. */
async function canConfirmClientOnZoom(sessionDoc) {
  if (!sessionDoc.isZoom) return { ok: true };
  const others = await countConcurrentZoomParticipants(
    sessionDoc.startTime,
    sessionDoc.endTime,
    sessionDoc._id
  );
  const onThis = sessionDoc.enrolledClients?.length || 0;
  if (others + onThis + 1 > ZOOM_MAX_CONCURRENT) {
    return { ok: false, reason: 'Zoom capacity reached for this time window' };
  }
  return { ok: true };
}

module.exports = { countConcurrentZoomParticipants, canConfirmClientOnZoom };
