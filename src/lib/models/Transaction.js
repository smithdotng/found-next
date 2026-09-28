// Ported unchanged from the Express app so both apps share one MongoDB schema.
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    buyer: {
        name: String,
        email: String,
        phone: String
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    agentLink: String,
    transactionType: {
        type: String,
        enum: ['sale', 'rent', 'lease'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    agencyFee: {
        type: Number,
        required: true
    },
    commissionSplit: {
        agent: {
            percentage: Number,
            amount: Number
        },
        promoter: {
            percentage: Number,
            amount: Number
        },
        platform: {
            percentage: Number,
            amount: Number
        }
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentReference: String,
    transactionDate: {
        type: Date,
        default: Date.now
    },
    completedDate: Date,
    notes: String
});

export default mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);