import mongoose, { Schema, type Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  project: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    project: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
  }
);

export const ProjectModel = mongoose.model<IProject>('Project', projectSchema);
