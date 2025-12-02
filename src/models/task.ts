import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    userId: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    date: Date;
    completed: boolean;
}

const TaskSchema: Schema = new Schema({
    userId: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    date: { type: Date, default: Date.now },
    completed: { type: Boolean, default: false },
});

export default mongoose.model<ITask>('Task', TaskSchema);
