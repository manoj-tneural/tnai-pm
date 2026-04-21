-- ============================================================
-- SAKSHI DATA INSERTION
-- Run this file to insert Sakshi features, deployments, and tasks
-- ============================================================

-- ── SAKSHI FEATURES ──────────────────────────────────────────
with p as (select id from public.products where slug = 'sakshi')
insert into public.features (product_id, feature_id, name, category, status, dev_hours, llm_based, pre_trained, deployment_type, cost, requirements, notes, sort_order)
select p.id, f.feature_id, f.name, f.category, f.status, f.dev_hours, f.llm_based, f.pre_trained, f.deployment_type, f.cost, f.requirements, f.notes, f.sort_order
from p, (values
  ('F_001','People Counter','General Retail','in_progress','8 Hrs',false,'Pre Trained + Custom','','','','Determine ROI, implement person tracking, filter staff',1),
  ('F_002','Gender and Age Identification','General Retail','planned','—',false,'Y','AWS','','Static IP required','',2),
  ('F_003','Queue Monitoring','General Retail','completed','6 Hrs',false,'Y','E2E (L40S NVIDIA)','50000 / Month','Static IP','Determine ROI, tracking logic',3),
  ('F_004','Heatmaps','General Retail','completed','3 Hrs',false,'Y','Edge Raspberry + Helio','40000 one-time HW','One-time hardware cost','Person detection and tracking logic',4),
  ('F_005','Unattended Bag Detection','General Retail','completed','4 Hrs',false,'Y','Edge RaspberryPi','10000 one-time HW','One-time hardware cost','30s temporal tracking, COCO classes 24/26',5),
  ('F_006','Uniform Compliance','General Retail','planned','3 Hrs',false,'N','','','','',6),
  ('F_007','Fire and Smoke Detection','General Retail','completed','2 Hrs',false,'Y','','','','',7),
  ('F_008','Restricted Area Monitoring','General Retail','planned','4 Hrs',false,'N','','','Determine ROI, write detection logic','',8),
  ('F_009','Cash Drawer Opening Detection','General Retail','planned','2 Hrs',false,'N','','','','',9),
  ('F_010','Mopping Detection','General Retail','planned','2 Hrs',false,'N','','','','',10),
  ('F_011','Phone Usage by Employees','General Retail','planned','2 Hrs',false,'N','','','','',11),
  ('F_012','Fall Detection','General Retail','completed','2 Hrs',false,'Y','','','Height reduction + bounding box shrinkage logic','',12),
  ('F_013','Store Opening/Closing Time','General Retail','planned','2 Hrs',false,'N','','','Shutter opening/closing logic','',13),
  ('F_014','Store Theft Detection','General Retail','planned','—',false,'N','','','ROI + theft logic per item','',14),
  ('F_015','Stock Room Monitoring','General Retail','planned','—',false,'Y','','','','',15),
  ('F_016','PPE Compliance (Hairnet/Gloves/Apron)','Restaurant & Cafe','planned','2 Hrs',false,'N','','','','',16),
  ('F_017','Table Cleanliness','Restaurant & Cafe','planned','4 Hrs',false,'N','','','','',17),
  ('F_018','Service Time Monitoring','Restaurant & Cafe','planned','8-12 Hrs',false,'N','','','ROI per table, staff ID + person tracking','',18),
  ('F_019','Vehicle Identification','EV / Automotive','planned','4 Hrs',false,'N','','','API key or OCR-based extraction','',19),
  ('F_020','Number Plate Detection','EV / Automotive','planned','4 Hrs',false,'N','','','API key or OCR extraction','',20),
  ('F_021','Charging Time Tracking','EV / Automotive','planned','8 Hrs',false,'N','','','Detect vehicle, determine slot ROI, gun plug-in/out time','',21),
  ('F_022','Unauthorized Parking','EV / Automotive','planned','8 Hrs',false,'N','','','','',22),
  ('F_023','Energy Loss & Monitoring','EV / Automotive','planned','12 Hrs',false,'N','','','Cross-check DB, perform analysis','',23),
  ('F_024','AI Vault Operating System','Bank / High Security','planned','—',false,'N','','','','',24),
  ('F_025','Off-Time Activity Monitoring','Bank / High Security','planned','—',false,'N','','','','',25),
  ('F_026','Integration with Sensors','Bank / High Security','planned','—',false,'N','','','','',26),
  ('F_027','SOP Compliance Monitoring','Bank / High Security','planned','—',false,'N','','','','',27)
) as f(feature_id,name,category,status,dev_hours,llm_based,pre_trained,deployment_type,cost,requirements,notes,sort_order);

-- ── SAKSHI DEPLOYMENTS (customers) ───────────────────────────
with p as (select id from public.products where slug = 'sakshi')
insert into public.deployments (product_id, customer_name, status, notes)
select p.id, d.customer_name, d.status, d.notes
from p, (values
  ('MyG Future','completed','15-day deployment completed. Kubernetes deployment pending.'),
  ('Nyaz','in_progress','Currently in pipeline and annotation phase.'),
  ('Supreme','in_progress','Active deployment.'),
  ('GoEC','in_progress','Active deployment.'),
  ('Heael','in_progress','Active deployment.'),
  ('MyDesignation','planning','Onboarding initiated.'),
  ('FedFina','planning','Onboarding initiated.')
) as d(customer_name, status, notes);

-- Seed deployment tasks for MyG Future from the master plan
with dep as (
  select d.id from public.deployments d
  join public.products p on d.product_id = p.id
  where p.slug = 'sakshi' and d.customer_name = 'MyG Future'
)
insert into public.deployment_tasks (deployment_id, day_label, phase, task_no, task_desc, owner, status, sort_order)
select dep.id, t.day_label, t.phase, t.task_no, t.task_desc, t.owner, t.status, t.sort_order
from dep, (values
  ('Day 0','Requirement Gathering','1','Identify all use cases required by client','CS','done',1),
  ('Day 0','Requirement Gathering','2','Define success criteria for each use case','CS','done',2),
  ('Day 0','Requirement Gathering','3','Confirm alerting platforms (Telegram / WhatsApp / Dashboard)','CS','done',3),
  ('Day 0','Requirement Gathering','4','Identify analytics/reporting requirements','CS','done',4),
  ('Day 0','Requirement Gathering','5','Define user roles (Admin / Employee / Manager)','CS','done',5),
  ('Day 0','Resource Planning','6','Confirm number of stores to onboard','CS / Engg','done',6),
  ('Day 0','Resource Planning','7','Confirm number of cameras per store','CS / Engg','done',7),
  ('Day 0','Resource Planning','8','Estimate compute requirements (CPU/GPU/Memory)','CS / Engg','done',8),
  ('Day 0','Infrastructure Readiness','11','Server (Cloud/On-prem) is provisioned','Engg','done',11),
  ('Day 0','Infrastructure Readiness','12','GPU availability verified (if needed)','Engg','done',12),
  ('Day 0','Infrastructure Readiness','13','Docker & dependencies installed','Engg','done',13),
  ('Day 0','Camera Angle Verification','15','Validate field of view (FOV)','CS / Engg','done',15),
  ('Day 0','Stream Quality Check','19','RTSP/stream URLs verified','CS / Engg','done',19),
  ('Day 1','Data Collection','24','Collect images/videos from all stores','Engg','ongoing',24),
  ('Day 1-2','Annotation','28','Define annotation guidelines','Intern Team','ongoing',28),
  ('Day 1-2','Dataset Management','32','Dataset versioning done','Engg','ongoing',32),
  ('Day 3-5','Model Training','35','Select model architecture','Engg','done',35),
  ('Day 3-5','Model Training','36','Train model','Engg','done',36),
  ('Day 3-5','Model Training','37','Convert model to ONNX','Engg','done',37),
  ('Day 6','Model Validation','40','Test on real-world streams','Engg','done',40),
  ('Day 7','Model Deployment','44','Convert model to TensorRT engine (.engine)','Engg','done',44),
  ('Day 8','Pipeline Setup','48','Configure RTSP sources in DeepStream','Engg','done',48),
  ('Day 9','Use Case Configuration','50','Define ROI in nvdsanalytics config','Engg','done',50),
  ('Day 10','Alert System','54','Extract metadata from DeepStream (probe)','Engg','done',54),
  ('Day 11','Alert Logic','57','Implement alert conditions in probe/backend','Engg','done',57),
  ('Day 12','Testing','62','Test alerts triggered','CS / Engg','done',62),
  ('Day 12','Analytics API','65','Extract metadata (object count, events)','Engg','done',65),
  ('Day 13','Dashboard','68','Admin dashboard configured','Engg','done',68),
  ('Day 13','Role-Based Access Control','72','Roles defined','Engg','done',72),
  ('Day 13','Security','76','Authentication enabled','Engg','done',76),
  ('Day 14','Service Validation','80','All services running','CS / Engg','done',80),
  ('Day 15','Functional Testing','84','All use cases validated','CS','done',84),
  ('Day 15','Load Testing','86','Test multiple RTSP streams in pipeline','CS / Engg','todo',86),
  ('Day 16','Kubernetes Deployment','89','Setup Kubernetes cluster (local / cloud)','Engg','todo',89),
  ('Day 16','Kubernetes Deployment','90','Containerize application (Docker image readiness check)','Engg','todo',90),
  ('Day 16','Kubernetes Deployment','91','Deploy services on K8s','Engg','todo',91)
) as t(day_label, phase, task_no, task_desc, owner, status, sort_order);

-- Done! Run on EC2 with:
-- psql -h localhost -U tnai_user -d tnai_pm < 002_sakshi_data.sql
