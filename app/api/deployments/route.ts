import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Master template tasks for new deployments (same as original)
const MASTER_TASKS = [
  { day_label: 'Day 0', phase: 'Requirement Gathering', task_no: '1', task_desc: 'Identify all use cases required by client', owner: 'CS', sort_order: 1 },
  { day_label: 'Day 0', phase: 'Requirement Gathering', task_no: '2', task_desc: 'Define success criteria for each use case', owner: 'CS', sort_order: 2 },
  { day_label: 'Day 0', phase: 'Requirement Gathering', task_no: '3', task_desc: 'Confirm alerting platforms', owner: 'CS', sort_order: 3 },
  { day_label: 'Day 0', phase: 'Resource Planning', task_no: '4', task_desc: 'Confirm number of stores and cameras', owner: 'CS / Engg', sort_order: 4 },
  { day_label: 'Day 0', phase: 'Infrastructure Readiness', task_no: '5', task_desc: 'Server provisioned, Docker & dependencies installed', owner: 'Engg', sort_order: 5 },
  { day_label: 'Day 0', phase: 'Camera Angle Verification', task_no: '6', task_desc: 'Validate FOV, coverage, capture sample frames', owner: 'CS / Engg', sort_order: 6 },
  { day_label: 'Day 0', phase: 'Stream Quality Check', task_no: '7', task_desc: 'RTSP URLs verified, FPS stable, resolution sufficient', owner: 'CS / Engg', sort_order: 7 },
  { day_label: 'Day 1', phase: 'Data Collection', task_no: '8', task_desc: 'Collect images/videos from all stores', owner: 'Engg', sort_order: 8 },
  { day_label: 'Day 1-2', phase: 'Annotation', task_no: '9', task_desc: 'Annotate objects of interest + ROI zones', owner: 'Intern Team', sort_order: 9 },
  { day_label: 'Day 1-2', phase: 'Dataset Management', task_no: '10', task_desc: 'Dataset versioning, centralized storage, metadata', owner: 'Engg', sort_order: 10 },
  { day_label: 'Day 3-5', phase: 'Model Training', task_no: '11', task_desc: 'Select architecture, train, convert to ONNX/TensorRT', owner: 'Engg', sort_order: 11 },
  { day_label: 'Day 6', phase: 'Model Validation', task_no: '12', task_desc: 'Test on real-world streams, measure accuracy', owner: 'Engg', sort_order: 12 },
  { day_label: 'Day 7', phase: 'Model Deployment', task_no: '13', task_desc: 'Package model, deploy to Detection API', owner: 'Engg', sort_order: 13 },
  { day_label: 'Day 8', phase: 'Pipeline Setup', task_no: '14', task_desc: 'Configure RTSP sources, streammux, nvinfer, nvtracker', owner: 'Engg', sort_order: 14 },
  { day_label: 'Day 9', phase: 'Use Case Configuration', task_no: '15', task_desc: 'Define ROI, configure line crossing/zone rules', owner: 'Engg', sort_order: 15 },
  { day_label: 'Day 10', phase: 'Alert System', task_no: '16', task_desc: 'Extract metadata, integrate alert channels', owner: 'Engg', sort_order: 16 },
  { day_label: 'Day 11', phase: 'Alert Logic', task_no: '17', task_desc: 'Implement conditions, thresholds, deduplication', owner: 'Engg', sort_order: 17 },
  { day_label: 'Day 12', phase: 'Testing', task_no: '18', task_desc: 'Test alerts, delivery, accuracy validation', owner: 'CS / Engg', sort_order: 18 },
];

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { product_id, customer_name, status, day0_date, notes, num_stores, num_cameras } = await request.json();

    if (!product_id || !customer_name) {
      return NextResponse.json({ error: 'Missing required fields: product_id, customer_name' }, { status: 400 });
    }

    // Create deployment
    const deploymentResult = await query(
      `INSERT INTO deployments (product_id, customer_name, status, day0_date, notes, num_stores, num_cameras, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [product_id, customer_name, status || 'planning', day0_date || null, notes || null, num_stores || 1, num_cameras || 0]
    );

    const deployment = deploymentResult.rows[0];

    // Seed master tasks
    for (const task of MASTER_TASKS) {
      await query(
        `INSERT INTO deployment_tasks (deployment_id, day_label, phase, task_no, task_desc, owner, sort_order, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'todo')`,
        [deployment.id, task.day_label, task.phase, task.task_no, task.task_desc, task.owner, task.sort_order]
      );
    }

    return NextResponse.json({ deployment }, { status: 201 });
  } catch (error) {
    console.error('[Deployments API] POST error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create deployment' }, { status: 500 });
  }
}
