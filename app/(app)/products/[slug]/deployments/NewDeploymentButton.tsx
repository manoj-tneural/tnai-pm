'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function NewDeploymentButton({ productId, productSlug }: { productId: string; productSlug: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_name: '', status: 'planning', day0_date: '', notes: '', num_stores: '1', num_cameras: '0' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data } = await supabase.from('deployments').insert({
      product_id: productId,
      customer_name: form.customer_name,
      status: form.status,
      day0_date: form.day0_date || null,
      notes: form.notes || null,
      num_stores: parseInt(form.num_stores) || 1,
      num_cameras: parseInt(form.num_cameras) || 0,
    }).select().single();

    if (data) {
      // Seed master deployment tasks
      const masterTasks = [
        { day_label:'Day 0', phase:'Requirement Gathering', task_no:'1', task_desc:'Identify all use cases required by client', owner:'CS', sort_order:1 },
        { day_label:'Day 0', phase:'Requirement Gathering', task_no:'2', task_desc:'Define success criteria for each use case', owner:'CS', sort_order:2 },
        { day_label:'Day 0', phase:'Requirement Gathering', task_no:'3', task_desc:'Confirm alerting platforms', owner:'CS', sort_order:3 },
        { day_label:'Day 0', phase:'Resource Planning', task_no:'4', task_desc:'Confirm number of stores and cameras', owner:'CS / Engg', sort_order:4 },
        { day_label:'Day 0', phase:'Infrastructure Readiness', task_no:'5', task_desc:'Server provisioned, Docker & dependencies installed', owner:'Engg', sort_order:5 },
        { day_label:'Day 0', phase:'Camera Angle Verification', task_no:'6', task_desc:'Validate FOV, coverage, capture sample frames', owner:'CS / Engg', sort_order:6 },
        { day_label:'Day 0', phase:'Stream Quality Check', task_no:'7', task_desc:'RTSP URLs verified, FPS stable, resolution sufficient', owner:'CS / Engg', sort_order:7 },
        { day_label:'Day 1', phase:'Data Collection', task_no:'8', task_desc:'Collect images/videos from all stores', owner:'Engg', sort_order:8 },
        { day_label:'Day 1-2', phase:'Annotation', task_no:'9', task_desc:'Annotate objects of interest + ROI zones', owner:'Intern Team', sort_order:9 },
        { day_label:'Day 1-2', phase:'Dataset Management', task_no:'10', task_desc:'Dataset versioning, centralized storage, metadata', owner:'Engg', sort_order:10 },
        { day_label:'Day 3-5', phase:'Model Training', task_no:'11', task_desc:'Select architecture, train, convert to ONNX/TensorRT', owner:'Engg', sort_order:11 },
        { day_label:'Day 6', phase:'Model Validation', task_no:'12', task_desc:'Test on real-world streams, measure accuracy', owner:'Engg', sort_order:12 },
        { day_label:'Day 7', phase:'Model Deployment', task_no:'13', task_desc:'Package model, deploy to Detection API', owner:'Engg', sort_order:13 },
        { day_label:'Day 8', phase:'Pipeline Setup', task_no:'14', task_desc:'Configure RTSP sources, streammux, nvinfer, nvtracker', owner:'Engg', sort_order:14 },
        { day_label:'Day 9', phase:'Use Case Configuration', task_no:'15', task_desc:'Define ROI, configure line crossing/zone rules', owner:'Engg', sort_order:15 },
        { day_label:'Day 10', phase:'Alert System', task_no:'16', task_desc:'Extract metadata, integrate alert channels', owner:'Engg', sort_order:16 },
        { day_label:'Day 11', phase:'Alert Logic', task_no:'17', task_desc:'Implement conditions, thresholds, deduplication', owner:'Engg', sort_order:17 },
        { day_label:'Day 12', phase:'Testing', task_no:'18', task_desc:'Test alerts, delivery, accuracy validation', owner:'CS / Engg', sort_order:18 },
        { day_label:'Day 12', phase:'Analytics API', task_no:'19', task_desc:'Extract + store metadata, aggregation logic', owner:'Engg', sort_order:19 },
        { day_label:'Day 13', phase:'Dashboard', task_no:'20', task_desc:'Admin + employee dashboard configured', owner:'Engg', sort_order:20 },
        { day_label:'Day 13', phase:'Security', task_no:'21', task_desc:'Auth, RBAC, stream access restriction', owner:'Engg', sort_order:21 },
        { day_label:'Day 14', phase:'Service Validation', task_no:'22', task_desc:'All services running, logs clean, E2E test', owner:'CS / Engg', sort_order:22 },
        { day_label:'Day 15', phase:'Functional Testing', task_no:'23', task_desc:'All use cases validated, alerts verified', owner:'CS', sort_order:23 },
        { day_label:'Day 15-16', phase:'Load Testing & K8s', task_no:'24', task_desc:'Multi-stream load test + Kubernetes deployment', owner:'Engg', sort_order:24 },
      ];
      await supabase.from('deployment_tasks').insert(masterTasks.map(t => ({ ...t, deployment_id: data.id, status: 'todo' })));
    }

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">+ New Deployment</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">New Customer Deployment</h3>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Customer Name *</label>
                <input className="input" required value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Status</label>
                  <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="label">Day 0 Date</label>
                  <input type="date" className="input" value={form.day0_date} onChange={e => setForm(f => ({ ...f, day0_date: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">No. of Stores</label>
                  <input type="number" className="input" value={form.num_stores} min="1" onChange={e => setForm(f => ({ ...f, num_stores: e.target.value }))} />
                </div>
                <div>
                  <label className="label">No. of Cameras</label>
                  <input type="number" className="input" value={form.num_cameras} min="0" onChange={e => setForm(f => ({ ...f, num_cameras: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="textarea" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
                  {loading ? 'Creating…' : 'Create + Seed Tasks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
