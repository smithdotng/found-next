// Ported unchanged from the Express app so both apps share one MongoDB schema.
import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    bankDetails: {
        bankName: {
            type: String,
            required: true
        },
        accountNumber: {
            type: String,
            required: true
        },
        accountName: {
            type: String,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'processed', 'rejected'],
        default: 'pending'
    },
    processedAt: Date,
    transactionReference: String,
    adminNotes: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);