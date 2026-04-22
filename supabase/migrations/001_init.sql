-- ============================================================
-- TNAI Project Management Platform — DB Schema + Seed
-- Self-Managed PostgreSQL (Custom JWT Auth)
-- ============================================================

-- PROFILES (Custom Auth Table)
create table if not exists public.profiles (
  id           uuid primary key default gen_random_uuid(),
  email        text unique not null,
  password_hash text,
  full_name    text,
  role         text not null default 'engineer' check (role in ('management','engineer','project_manager','sales','testing')),
  avatar_url   text,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- PRODUCTS
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique not null,
  tagline      text,
  description  text,
  status       text default 'active' check (status in ('active','beta','planning','archived')),
  tech_stack   text[],
  color        text default '#3b82f6',
  icon         text default '🤖',
  created_at   timestamptz default now()
);

-- FEATURES
create table if not exists public.features (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid references public.products(id) on delete cascade,
  feature_id      text,
  name            text not null,
  category        text,
  status          text default 'planned' check (status in ('completed','in_progress','planned','blocked')),
  dev_hours       text,
  llm_based       boolean default false,
  pre_trained     text,
  deployment_type text,
  num_usecases    int,
  num_cameras     int,
  cost            text,
  requirements    text,
  notes           text,
  start_date      date,
  end_date        date,
  assigned_to     uuid[],
  sort_order      int default 0,
  created_at      timestamptz default now()
);

-- DEPLOYMENTS (customer deployments)
create table if not exists public.deployments (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid references public.products(id) on delete cascade,
  customer_name   text not null,
  status          text default 'in_progress' check (status in ('planning','in_progress','completed','on_hold','cancelled')),
  day0_date       date,
  notes           text,
  num_stores      int default 1,
  num_cameras     int default 0,
  created_at      timestamptz default now()
);

-- DEPLOYMENT TASKS
create table if not exists public.deployment_tasks (
  id              uuid primary key default gen_random_uuid(),
  deployment_id   uuid references public.deployments(id) on delete cascade,
  day_label       text,
  phase           text,
  task_no         text,
  task_desc       text not null,
  owner           text,
  status          text default 'todo' check (status in ('done','ongoing','todo','blocked')),
  remarks         text,
  completion_date date,
  sort_order      int default 0,
  created_at      timestamptz default now()
);

-- DAILY LOGS
create table if not exists public.daily_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  product_id  uuid references public.products(id) on delete cascade,
  log_date    date not null default current_date,
  yesterday   text,
  today       text,
  blockers    text,
  created_at  timestamptz default now(),
  unique (user_id, product_id, log_date)
);

-- TICKETS
create table if not exists public.tickets (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid references public.products(id) on delete cascade,
  deployment_id uuid references public.deployments(id) on delete set null,
  title         text not null,
  description   text,
  type          text default 'bug' check (type in ('bug','feature','improvement','task','question')),
  priority      text default 'medium' check (priority in ('critical','high','medium','low')),
  status        text default 'open' check (status in ('open','in_progress','in_review','resolved','closed')),
  reporter_id   uuid references public.profiles(id) on delete set null,
  assignee_id   uuid references public.profiles(id) on delete set null,
  due_date      date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- TICKET COMMENTS
create table if not exists public.ticket_comments (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid references public.tickets(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  comment    text not null,
  created_at timestamptz default now()
);

-- BACKEND TASKS (SpaceZap backend rework tracking)
create table if not exists public.dev_tasks (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid references public.products(id) on delete cascade,
  phase        text,
  task_id      text,
  sub_task     text not null,
  description  text,
  dev_hours    int,
  planned_start date,
  planned_end   date,
  status       text default 'todo' check (status in ('done','in_progress','todo','blocked')),
  assignee_id  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz default now()
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Products
insert into public.products (name, slug, tagline, description, status, tech_stack, color, icon) values
(
  'Sakshi AI',
  'sakshi',
  'AI-powered surveillance & retail intelligence',
  'Computer vision platform for retail, restaurants, EV stations and high-security environments. Provides real-time monitoring, people counting, heatmaps, compliance checks and alert systems via DeepStream pipelines.',
  'active',
  ARRAY['DeepStream','TensorRT','ONNX','NVIDIA GPU','FastAPI','Telegram Bot','RTSP','Docker'],
  '#7c3aed',
  '👁️'
),
(
  'SpaceZap',
  'spacezap',
  'AI-powered spatial intelligence & floor plan generation',
  'Mobile-first LiDAR scanning app that generates CAD floor plans, elevations, 3D models and BOQ layouts from Apple LiDAR scans. Uses RANSAC + DBSCAN hybrid algorithms for wall detection.',
  'active',
  ARRAY['Apple LiDAR','ARKit','Open3D','RANSAC','DBSCAN','Python','Django','React','CAD/DXF'],
  '#0891b2',
  '🏗️'
),
(
  'DataDime',
  'datadime',
  'Natural language analytics & AI query engine (AuditBlaze 2.0)',
  'LLM-powered data analytics platform supporting NL queries over SQL, Excel, CSV and PDF sources. Features intelligent agent routing, AI forecasting, semantic vector search and dynamic chart generation.',
  'active',
  ARRAY['FastAPI','React','PostgreSQL','Qdrant','Redis','OpenAI GPT-4','Claude API','Docker','SQLAlchemy','PyPDF2'],
  '#059669',
  '📊'
);

-- ── SAKSHI FEATURES ──────────────────────────────────────────
with p as (select id from public.products where slug = 'sakshi')
insert into public.features (product_id, feature_id, name, category, status, dev_hours, llm_based, pre_trained, deployment_type, num_usecases, num_cameras, cost, requirements, notes, sort_order)
select p.id, f.feature_id, f.name, f.category, f.status, f.dev_hours, f.llm_based, f.pre_trained, f.deployment_type, f.num_usecases, f.num_cameras, f.cost, f.requirements, f.notes, f.sort_order
from p, (values
  ('F_001','People Counter','General Retail','in_progress','8 Hrs',false,'Pre Trained + Custom','','',null,null,'Determine ROI, implement person tracking, filter staff','1',1),
  ('F_002','Gender and Age Identification','General Retail','planned','—',false,'Y','AWS','',null,null,'Static IP required','2',2),
  ('F_003','Queue Monitoring','General Retail','completed','6 Hrs',false,'Y','E2E (L40S NVIDIA)','',10,80,'50000 / Month','Static IP','Determine ROI, tracking logic','3',3),
  ('F_004','Heatmaps','General Retail','completed','3 Hrs',false,'Y','Edge Raspberry + Helio','',5,5,'40000 one-time HW','One-time hardware cost','Person detection and tracking logic','4',4),
  ('F_005','Unattended Bag Detection','General Retail','completed','4 Hrs',false,'Y','Edge RaspberryPi','',null,4,'10000 one-time HW','One-time hardware cost','30s temporal tracking, COCO classes 24/26','5',5),
  ('F_006','Uniform Compliance','General Retail','planned','3 Hrs',false,'N','','',null,null,'','6',6),
  ('F_007','Fire and Smoke Detection','General Retail','completed','2 Hrs',false,'Y','','',null,null,'','7',7),
  ('F_008','Restricted Area Monitoring','General Retail','planned','4 Hrs',false,'N','','',null,null,'Determine ROI, write detection logic','8',8),
  ('F_009','Cash Drawer Opening Detection','General Retail','planned','2 Hrs',false,'N','','',null,null,'','9',9),
  ('F_010','Mopping Detection','General Retail','planned','2 Hrs',false,'N','','',null,null,'','10',10),
  ('F_011','Phone Usage by Employees','General Retail','planned','2 Hrs',false,'N','','',null,null,'','11',11),
  ('F_012','Fall Detection','General Retail','completed','2 Hrs',false,'Y','','',null,null,'Height reduction + bounding box shrinkage logic','12',12),
  ('F_013','Store Opening/Closing Time','General Retail','planned','2 Hrs',false,'N','','',null,null,'Shutter opening/closing logic','13',13),
  ('F_014','Store Theft Detection','General Retail','planned','—',false,'N','','',null,null,'ROI + theft logic per item','14',14),
  ('F_015','Stock Room Monitoring','General Retail','planned','—',false,'Y','','',null,null,'','15',15),
  ('F_016','PPE Compliance (Hairnet/Gloves/Apron)','Restaurant & Cafe','planned','2 Hrs',false,'N','','',null,null,'','16',16),
  ('F_017','Table Cleanliness','Restaurant & Cafe','planned','4 Hrs',false,'N','','',null,null,'','17',17),
  ('F_018','Service Time Monitoring','Restaurant & Cafe','planned','8-12 Hrs',false,'N','','',null,null,'ROI per table, staff ID + person tracking','18',18),
  ('F_019','Vehicle Identification','EV / Automotive','planned','4 Hrs',false,'N','','',null,null,'API key or OCR-based extraction','19',19),
  ('F_020','Number Plate Detection','EV / Automotive','planned','4 Hrs',false,'N','','',null,null,'API key or OCR extraction','20',20),
  ('F_021','Charging Time Tracking','EV / Automotive','planned','8 Hrs',false,'N','','',null,null,'Detect vehicle, determine slot ROI, gun plug-in/out time','21',21),
  ('F_022','Unauthorized Parking','EV / Automotive','planned','8 Hrs',false,'N','','',null,null,'','22',22),
  ('F_023','Energy Loss & Monitoring','EV / Automotive','planned','12 Hrs',false,'N','','',null,null,'Cross-check DB, perform analysis','23',23),
  ('F_024','AI Vault Operating System','Bank / High Security','planned','—',false,'N','','',null,null,'','24',24),
  ('F_025','Off-Time Activity Monitoring','Bank / High Security','planned','—',false,'N','','',null,null,'','25',25),
  ('F_026','Integration with Sensors','Bank / High Security','planned','—',false,'N','','',null,null,'','26',26),
  ('F_027','SOP Compliance Monitoring','Bank / High Security','planned','—',false,'N','','',null,null,'','27',27)
) as f(feature_id,name,category,status,dev_hours,llm_based,pre_trained,deployment_type,x,num_usecases,num_cameras,cost,requirements,notes,sort_order);

-- ── SPACEZAP FEATURES ─────────────────────────────────────────
with p as (select id from public.products where slug = 'spacezap')
insert into public.features (product_id, feature_id, name, category, status, notes, sort_order)
select p.id, f.feature_id, f.name, f.category, f.status, f.notes, f.sort_order
from p, (values
  ('SZ_001','Mesh 3D Capture (Apple LiDAR)','Mobile','completed','Use Apple LiDAR to capture a 3D mesh of the space',1),
  ('SZ_002','Project Tracking','Mobile','completed','Create, save, and revisit projects at a later time',2),
  ('SZ_003','Outline Generation (CAD)','Mobile','completed','A CAD file with layout generated with all elements including beams',3),
  ('SZ_004','Elevation Generation (4 Views)','Mobile','completed','4 CAD files showing four primary elevations of the captured site',4),
  ('SZ_005','Recce PDF Generation','Mobile','completed','PDF with all site information including outline and elevation images',5),
  ('SZ_006','Independent LiDAR (External Sensor)','Mobile','planned','Leverage external plug and play sensor',6),
  ('SZ_007','Multi-OS Application Availability','Mobile','planned','Redesign for mobile and multiple operating systems',7),
  ('SZ_008','Design Generation (4 CAD Layouts)','Design','completed','Create 4 CAD layouts using client design language',8),
  ('SZ_009','3D Plan Generation + Walkthrough','Design','completed','Automatic generation of 3D plan from 2D + walkthrough',9),
  ('SZ_010','0-Shot Plan Generation via Chat','Design','planned','Create a plan through chat with no prior input',10),
  ('SZ_011','Fixture Movement/Rotation (Web Portal)','AI Design Portal','completed','Move and rotate fixtures directly on the web',11),
  ('SZ_012','Text-Based Design Editing','AI Design Portal','completed','Edit with messages rearranging groups of fixtures',12),
  ('SZ_013','Complete Plan Redesign','AI Design Portal','planned','Redesign the plan completely',13),
  ('SZ_014','Unique Design Generation','AI Design Portal','planned','Break design language to create new option',14),
  ('SZ_015','BOQ Layout Generation (Lighting/Camera/HVAC)','BOQ','completed','Create independent layouts for lighting, cameras, and HVAC',15),
  ('SZ_016','BOQ Excel Auto-Generation','BOQ','completed','Automatically generate Excel sheet for complete BOQ with item, qty, price',16)
) as f(feature_id,name,category,status,notes,sort_order);

-- ── SPACEZAP DEV TASKS (Backend Rework) ──────────────────────
with p as (select id from public.products where slug = 'spacezap')
insert into public.dev_tasks (product_id, phase, task_id, sub_task, description, dev_hours, planned_start, planned_end, status)
select p.id, f.phase, f.task_id, f.sub_task, f.description, f.dev_hours, f.planned_start::date, f.planned_end::date, f.status
from p, (values
  ('PHASE 1 — RANSAC','1.1','Y-Height Filtering','Filter raw point cloud to wall-band height range using numpy boolean mask.',1,'2026-04-02','2026-04-02','done'),
  ('PHASE 1 — RANSAC','1.2','Confidence Filter','Pass min_confidence=1 to exclude low-quality ARKit LiDAR readings.',1,'2026-04-02','2026-04-02','done'),
  ('PHASE 1 — RANSAC','1.3','Normal Estimation','Open3D KDTree surface normal estimation replacing camera-ray proxy.',1,'2026-04-02','2026-04-02','done'),
  ('PHASE 1 — RANSAC','1.4','Circular Histogram','180-bin histogram of XZ normal components, smoothed with gaussian_filter1d.',2,'2026-04-02','2026-04-02','done'),
  ('PHASE 1 — RANSAC','1.5','Axis Lock','Top 2 peaks from histogram; handles non-Manhattan rooms.',1,'2026-04-02','2026-04-02','done'),
  ('PHASE 1 — RANSAC','1.6','1D Projection','Project wall-band XZ onto wall normal axis.',1,'2026-04-02','2026-04-02','done'),
  ('PHASE 1 — RANSAC','1.7','Peak Finding','1cm-bin histogram of 1D distances with lenient fallback mode.',1,'2026-04-02','2026-04-02','done'),
  ('PHASE 1 — RANSAC','1.8','Iterative Refinement','3-pass inlier tightening per detected wall peak.',2,'2026-04-02','2026-04-02','done'),
  ('PHASE 1 — RANSAC','1.9','Corner Solver','Solve 2×2 linear system for wall intersections.',1,'2026-04-02','2026-04-02','done'),
  ('PHASE 1 — RANSAC','1.10','Grid Rasterization','Sort corners CCW, draw polygon, fill with binary_fill_holes.',2,'2026-04-02','2026-04-02','done'),
  ('PHASE 1 — RANSAC','1.11','A/B Testing','Tested on DepthExport_2026-03-27 vs existing pipeline.',5,'2026-04-05','2026-04-05','done'),
  ('PHASE 1 — RANSAC','1.12','Debug Output','3 PNGs: orientation histogram, wall histograms, occupancy grid.',3,'2026-04-05','2026-04-05','done'),
  ('PHASE 2 — DBSCAN','2.1','Voxel Downsampling','Downsample wall-band to 5cm voxels via Open3D.',3,'2026-04-08','2026-04-08','done'),
  ('PHASE 2 — DBSCAN','2.3','Epsilon Tuning','Run pcd.cluster_dbscan(eps=0.15, min_points=50).',3,'2026-04-08','2026-04-08','done'),
  ('PHASE 2 — DBSCAN','2.4','Wall vs Pillar Classification','PCA per cluster; WALL vs PILLAR vs DISCARD rules.',4,'2026-04-08','2026-04-08','done'),
  ('PHASE 2 — DBSCAN','2.5','Local PCA Fit','PCA plane fitting per cluster.',4,'2026-04-09','2026-04-09','done'),
  ('PHASE 2 — DBSCAN','2.6','Extent Detection','2nd/98th percentile of tangent projections.',2,'2026-04-09','2026-04-09','done'),
  ('PHASE 2 — DBSCAN','2.7','Corner Solver (DBSCAN)','2×2 intersection with tangent extent validation.',4,'2026-04-09','2026-04-09','done'),
  ('PHASE 2 — DBSCAN','2.8','Debug Output (DBSCAN)','3 debug outputs including cluster top-view.',2,'2026-04-09','2026-04-09','done'),
  ('PHASE 2 — DBSCAN','2.9','DBSCAN Testing & Validation','5.9s runtime. Fails on under-scanned walls. Root cause: spatial density cannot recover RANSAC global histogram.',4,'2026-04-09','2026-04-09','done'),
  ('PHASE 3 — HYBRID','3.1','Removal Loop','_hybrid_mark_explained(): per-point distance to RANSAC walls, strict 20mm / relaxed 50mm gate.',3,'2026-04-10','2026-04-10','done'),
  ('PHASE 3 — HYBRID','3.2','Handoff Logic','5% residual gate before triggering DBSCAN on residual.',2,'2026-04-10','2026-04-10','done'),
  ('PHASE 3 — HYBRID','3.3','Deduplication','DBSCAN on residual with relaxed params; no dedup needed by definition.',2,'2026-04-10','2026-04-10','done'),
  ('PHASE 3 — HYBRID','3.4','Payload Generation','Draw DBSCAN walls + pillars on RANSAC occ grid; clip to room polygon.',4,'2026-04-10','2026-04-10','done'),
  ('PHASE 3 — HYBRID','3.5','Server Optimization','Optimize Python memory and Django execution speed (< 30s).',3,null,null,'in_progress'),
  ('PHASE 3 — HYBRID','3.6','Cleanup & Docs','Final code commenting and technical documentation for handover.',2,null,null,'todo')
) as f(phase,task_id,sub_task,description,dev_hours,planned_start,planned_end,status);

-- ── DATADIME FEATURES ─────────────────────────────────────────
with p as (select id from public.products where slug = 'datadime')
insert into public.features (product_id, feature_id, name, category, status, dev_hours, llm_based, deployment_type, cost, requirements, notes, sort_order)
select p.id, f.feature_id, f.name, f.category, f.status, f.dev_hours, f.llm_based, f.deployment_type, f.cost, f.requirements, f.notes, f.sort_order
from p, (values
  ('F_001','Natural Language Query Engine','Core Query & NL Engine','completed','40 Hrs',true,'AWS / E2E Cloud','8000 / Month','OpenAI GPT-4 / Claude API, PostgreSQL','Parse query, classify intent, route to agent, return structured JSON',1),
  ('F_002','Multi-Source Data Support (Excel/CSV/SQL/PDF)','Core Query & NL Engine','completed','32 Hrs',true,'','','pandas, openpyxl, PyPDF2, SQLAlchemy','Unified schema normalization across all source types',2),
  ('F_003','Intelligent Agent Routing System','Core Query & NL Engine','completed','24 Hrs',true,'AWS / E2E Cloud','8000 / Month','FastAPI, async workers','Map intent to DB/Excel/Vector/Web/Conversation agent',3),
  ('F_004','Real-Time Streaming Responses (SSE)','Core Query & NL Engine','completed','16 Hrs',false,'','','FastAPI, React EventSource API','Server-Sent Events endpoint, token-by-token streaming',4),
  ('F_005','Smart Column Type Detection','Core Query & NL Engine','completed','8 Hrs',false,'','','pandas, regex','Detect area, date, monetary column types',5),
  ('F_006','AI-Powered Forecasting Agent','AI Intelligence & Forecasting','completed','48 Hrs',true,'E2E (L40S NVIDIA)','15000 / Month','Claude / GPT-4 API, pandas','Time-series forecasting with confidence intervals',6),
  ('F_007','Forecast Accuracy Tracking','AI Intelligence & Forecasting','completed','20 Hrs',true,'','','PostgreSQL, SQLAlchemy, numpy','MAE/MAPE/RMSE metrics vs historical forecasts',7),
  ('F_008','Context-Aware Insights Agent','AI Intelligence & Forecasting','in_progress','24 Hrs',true,'','','LLM API, Redis for session cache','Anomaly/outlier highlighting with conversation context',8),
  ('F_009','Market Intelligence Agent (Web)','AI Intelligence & Forecasting','in_progress','32 Hrs',true,'','','WebSearch API, BeautifulSoup / Playwright','Scrape and merge external data with internal results',9),
  ('F_010','Pre-SQL Entity Filter Detection','AI Intelligence & Forecasting','completed','12 Hrs',true,'','','SQLite, LLM API','Detect mandatory filters before SQL generation, dry-run validation',10),
  ('F_011','Multi-User JWT Authentication','User & Access Management','completed','16 Hrs',false,'','','PyJWT, bcrypt, FastAPI','Registration, login, token refresh/revoke',11),
  ('F_012','Role-Based Access Control (RBAC)','User & Access Management','completed','20 Hrs',false,'','','SQLAlchemy, FastAPI middleware','SUPER_ADMIN/ADMIN/GROUP_ADMIN/USER with group-level isolation',12),
  ('F_013','Document Upload & Async Processing','User & Access Management','completed','16 Hrs',false,'','','FastAPI BackgroundTasks, aiofiles','Multipart upload, background ingestion queue, status polling',13),
  ('F_014','Conversation Threading & History','User & Access Management','completed','12 Hrs',false,'','','PostgreSQL, SQLAlchemy','Store Q&A turns, export as PDF/JSON',14),
  ('F_015','Vector-Based Semantic Search (Qdrant)','Vector & Semantic Search','completed','24 Hrs',true,'','','Qdrant, OpenAI Embeddings API','512-token chunks, cosine similarity threshold',15),
  ('F_016','Knowledge Base System','Vector & Semantic Search','completed','20 Hrs',true,'','','Qdrant, PyPDF2, pandas','Admin uploads, auto vectorization, KB fused with SQL results',16),
  ('F_017','Dynamic Chart Generation','Visualization & Reporting','completed','24 Hrs',false,'','','React, Recharts, TypeScript','Bar/line/pie/area charts with drill-down',17),
  ('F_018','Rich Narrative / Single-Row Templates','Visualization & Reporting','completed','8 Hrs',true,'','','LLM API, React','LLM narrative summary, INR formatting, card rendering',18),
  ('F_019','Export Reports (PDF / Excel)','Visualization & Reporting','planned','16 Hrs',false,'','','ReportLab / WeasyPrint, openpyxl, SMTP','Scheduled automated report delivery',19),
  ('F_020','Docker Containerization','Infrastructure & DevOps','completed','8 Hrs',false,'','','Docker, Docker Compose','Backend + frontend dockerfiles, docker-compose with PG+Qdrant+Redis',20),
  ('F_021','Redis Caching Layer','Infrastructure & DevOps','completed','8 Hrs',false,'','','Redis, aioredis','TTL cache, rate limiting, cache invalidation on data update',21),
  ('F_022','Multi-LLM Provider Support','Infrastructure & DevOps','completed','12 Hrs',true,'','','OpenAI SDK, Anthropic SDK, google-generativeai','Abstraction layer over OpenAI/Claude/Ollama/Gemini with cost tracking',22),
  ('F_023','Logging & Observability','Infrastructure & DevOps','in_progress','12 Hrs',false,'','','Python logging, Sentry / Grafana','Structured JSON logging, query latency, RBAC audit trail',23)
) as f(feature_id,name,category,status,dev_hours,llm_based,deployment_type,cost,requirements,notes,sort_order);

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

-- SpaceZap deployment targets
with p as (select id from public.products where slug = 'spacezap')
insert into public.deployments (product_id, customer_name, status, notes)
select p.id, d.name, d.status, d.notes
from p, (values
  ('Lenskart','in_progress','Active deployment. Plan generation and BOQ live. Recce PDF format alignment pending.'),
  ('Kissflow','planning','DWG layer name issue (A-DIM vs A-RCC) reported. Investigation in progress.')
) as d(name, status, notes);

-- DataDime deployments
with p as (select id from public.products where slug = 'datadime')
insert into public.deployments (product_id, customer_name, status, notes)
select p.id, d.name, d.status, d.notes
from p, (values
  ('Internal / Beta','in_progress','AuditBlaze 2.0 beta. Core features complete. Forecasting agent live.'),
  ('Pilot Customer TBD','planning','Awaiting pilot customer onboarding.')
) as d(name, status, notes);
