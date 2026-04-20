// Seed script — run with: node scripts/seed.mjs
const BASE = "https://ddualhmysfhojzghoidy.supabase.co/rest/v1";
const KEY =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdWFsaG15c2Zob2p6Z2hvaWR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIzMzk4NSwiZXhwIjoyMDkwODA5OTg1fQ.k6xv2goUiZoEcBd1le6TdvXQo4U0K1n-UIZ_PmqKjKg";
const USER_ID = "f80681d2-1fa9-4461-a92a-56ad34582dcd";

const headers = {
	apikey: KEY,
	Authorization: `Bearer ${KEY}`,
	"Content-Type": "application/json",
	Prefer: "return=representation",
};

async function post(table, body) {
	const res = await fetch(`${BASE}/${table}`, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(`${table}: ${JSON.stringify(data)}`);
	return Array.isArray(data) ? data : [data];
}

// ── Today's date helpers ──────────────────────────────────────────────────────
const today = new Date("2026-04-09");
const fmt = (d, h, m = 0) => {
	const dt = new Date(d);
	dt.setHours(h, m, 0, 0);
	return dt.toISOString();
};

// ── 1. Tasks ──────────────────────────────────────────────────────────────────
console.log("Seeding tasks...");
await post("tasks", [
	{ user_id: USER_ID, title: "Review Q2 product roadmap", priority: "high", block_size: "L", status: "active", position: 0 },
	{ user_id: USER_ID, title: "Fix authentication session bug", priority: "high", block_size: "M", status: "active", position: 1 },
	{ user_id: USER_ID, title: "Deploy hotfix to production", priority: "high", block_size: "S", status: "active", position: 2 },
	{ user_id: USER_ID, title: "Write unit tests for data layer", priority: "medium", block_size: "M", status: "active", position: 0 },
	{ user_id: USER_ID, title: "Update API documentation", priority: "medium", block_size: "M", status: "active", position: 1 },
	{ user_id: USER_ID, title: "Code review open PRs", priority: "medium", block_size: "S", status: "active", position: 2 },
	{ user_id: USER_ID, title: "Refactor utility functions", priority: "low", block_size: "L", status: "active", position: 0 },
	{ user_id: USER_ID, title: "Update project dependencies", priority: "low", block_size: "S", status: "active", position: 1 },
	{ user_id: USER_ID, title: "Clean up stale git branches", priority: "low", block_size: "S", status: "active", position: 2 },
]);
console.log("  ✓ 9 tasks");

// ── 2. Folders ────────────────────────────────────────────────────────────────
console.log("Seeding folders...");
const [work] = await post("folders", { user_id: USER_ID, name: "Work", position: 0 });
const [personal] = await post("folders", { user_id: USER_ID, name: "Personal", position: 1 });
const [reference] = await post("folders", { user_id: USER_ID, name: "Reference", position: 2 });
const [projects] = await post("folders", { user_id: USER_ID, name: "Projects", parent_id: work.id, position: 0 });
const [goals] = await post("folders", { user_id: USER_ID, name: "Goals", parent_id: personal.id, position: 0 });
console.log(`  ✓ Work(${work.id.slice(0,8)}), Personal, Reference, Projects, Goals`);

// ── 3. Pages / Files ──────────────────────────────────────────────────────────
console.log("Seeding files...");
await post("pages", [
	{
		user_id: USER_ID,
		title: "Product Roadmap 2026",
		folder_id: projects.id,
		page_type: "page",
		content: [{ id: "1", type: "paragraph", content: [{ type: "text", text: "Q1: Auth & onboarding. Q2: AI features. Q3: Collaboration. Q4: Mobile.", styles: {} }], props: { textColor: "default", backgroundColor: "default", textAlignment: "left" }, children: [] }],
	},
	{
		user_id: USER_ID,
		title: "Tech Stack Notes",
		folder_id: work.id,
		page_type: "page",
		content: [{ id: "2", type: "paragraph", content: [{ type: "text", text: "TanStack Start + Nitro, Supabase, shadcn/ui, BlockNote, FullCalendar.", styles: {} }], props: { textColor: "default", backgroundColor: "default", textAlignment: "left" }, children: [] }],
	},
	{
		user_id: USER_ID,
		title: "Annual Goals",
		folder_id: goals.id,
		page_type: "page",
		content: [{ id: "3", type: "paragraph", content: [{ type: "text", text: "Ship second brain app. Read 24 books. Build consistent morning routine.", styles: {} }], props: { textColor: "default", backgroundColor: "default", textAlignment: "left" }, children: [] }],
	},
	{
		user_id: USER_ID,
		title: "Meeting Notes",
		folder_id: work.id,
		page_type: "page",
		content: [{ id: "4", type: "paragraph", content: [{ type: "text", text: "Weekly sync agenda: blockers, priorities, demo prep.", styles: {} }], props: { textColor: "default", backgroundColor: "default", textAlignment: "left" }, children: [] }],
	},
	{
		user_id: USER_ID,
		title: "Book Notes — Atomic Habits",
		folder_id: reference.id,
		page_type: "page",
		content: [{ id: "5", type: "paragraph", content: [{ type: "text", text: "Identity-based habits. Make it obvious, attractive, easy, satisfying.", styles: {} }], props: { textColor: "default", backgroundColor: "default", textAlignment: "left" }, children: [] }],
	},
]);
console.log("  ✓ 5 files");

// ── 4. Calendar blocks (today = 2026-04-09) ────────────────────────────────────
console.log("Seeding calendar blocks...");
await post("calendar_blocks", [
	{ user_id: USER_ID, title: "Morning standup", start_time: fmt(today, 9, 0), end_time: fmt(today, 9, 30), block_type: "event", color: "#3b82f6" },
	{ user_id: USER_ID, title: "Deep work — roadmap review", start_time: fmt(today, 10, 0), end_time: fmt(today, 12, 0), block_type: "focus", color: "#8b5cf6" },
	{ user_id: USER_ID, title: "Lunch", start_time: fmt(today, 12, 0), end_time: fmt(today, 13, 0), block_type: "break", color: "#10b981" },
	{ user_id: USER_ID, title: "Code review session", start_time: fmt(today, 14, 0), end_time: fmt(today, 15, 0), block_type: "focus", color: "#8b5cf6" },
	{ user_id: USER_ID, title: "Sprint planning", start_time: fmt(today, 15, 30), end_time: fmt(today, 16, 30), block_type: "event", color: "#3b82f6" },
	// Tomorrow
	{ user_id: USER_ID, title: "Morning standup", start_time: fmt(new Date("2026-04-10"), 9, 0), end_time: fmt(new Date("2026-04-10"), 9, 30), block_type: "event", color: "#3b82f6" },
	{ user_id: USER_ID, title: "Deep work — unit tests", start_time: fmt(new Date("2026-04-10"), 10, 0), end_time: fmt(new Date("2026-04-10"), 12, 0), block_type: "focus", color: "#8b5cf6" },
	{ user_id: USER_ID, title: "1:1 with manager", start_time: fmt(new Date("2026-04-10"), 14, 0), end_time: fmt(new Date("2026-04-10"), 14, 30), block_type: "event", color: "#3b82f6" },
]);
console.log("  ✓ 8 calendar blocks");

console.log("\nSeed complete!");
