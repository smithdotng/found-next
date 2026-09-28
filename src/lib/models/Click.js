// Ported unchanged from the Express app so both apps share one MongoDB schema.
import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema({
    promotion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promotion',
        required: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    ipAddress: String,
    userAgent: String,
    referrer: String,
    converted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Click || mongoose.model('Click', clickSchema);