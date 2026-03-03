import { Router, type Request, type Response } from 'express';
import { ProjectModel } from '../models/Project.js';

const router = Router();

// GET /api/projects — List all projects
router.get('/', async (_req: Request, res: Response) => {
  try {
    const projects = await ProjectModel.find().sort({ updatedAt: -1 });
    const mapped = projects.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      project: p.project,
      createdAt: p.createdAt.getTime(),
      updatedAt: p.updatedAt.getTime(),
    }));
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id — Get a single project
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await ProjectModel.findById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({
      id: project._id.toString(),
      name: project.name,
      project: project.project,
      createdAt: project.createdAt.getTime(),
      updatedAt: project.updatedAt.getTime(),
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects — Create a new project
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, project } = req.body;
    if (!name || !project) {
      res.status(400).json({ error: 'name and project are required' });
      return;
    }
    const doc = await ProjectModel.create({ name, project });
    res.status(201).json({
      id: doc._id.toString(),
      name: doc.name,
      project: doc.project,
      createdAt: doc.createdAt.getTime(),
      updatedAt: doc.updatedAt.getTime(),
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id — Update a project
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, project } = req.body;
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (project !== undefined) update.project = project;

    const doc = await ProjectModel.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    if (!doc) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({
      id: doc._id.toString(),
      name: doc.name,
      project: doc.project,
      createdAt: doc.createdAt.getTime(),
      updatedAt: doc.updatedAt.getTime(),
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id — Delete a project
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await ProjectModel.findByIdAndDelete(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
