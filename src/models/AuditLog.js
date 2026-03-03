const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    entity_type: { type: String, required: true },
    entity_id: { type: mongoose.Schema.Types.Mixed, required: true },
    action: { type: String, enum: ['INSERT', 'UPDATE', 'DELETE'], required: true },
    timestamp: { type: Date, default: Date.now },
    previous_data: { type: Object }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
