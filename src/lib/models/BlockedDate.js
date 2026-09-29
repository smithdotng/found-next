// Ported from the Express app — dates a host closes on the calendar.
import mongoose from 'mongoose';

const blockedDateSchema = new mongoose.Schema({
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, enum: ['owner_use', 'maintenance', 'holiday', 'other', 'external_booking'], default: 'owner_use' },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.BlockedDate || mongoose.model('BlockedDate', blockedDateSchema);
