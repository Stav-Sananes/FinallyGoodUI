// Sample books for the fictional studio Saltmarsh & Rook. Amounts are US dollars.
export const AS_OF = "2026-11-23"; // the Monday the owner is looking at

export type Invoice = {
  id: string; // SR-0412
  client: string;
  project: string;
  amount: number;
  issued: string;
  due: string;
  paid: number; // received so far
  paidOn: string | null;
  reminded: string | null; // ISO date of the last reminder
};

export type Person = {
  id: string;
  name: string;
  role: string;
  kind: "staff" | "freelance";
  cost: number; // monthly cost to the studio
};

export type Account = { id: string; name: string; bank: string; balance: number; counted: boolean };
export type Cost = { id: string; name: string; monthly: number };
export type Retainer = { id: string; client: string; monthly: number };

export type Books = {
  accounts: Account[];
  invoices: Invoice[];
  people: Person[];
  costs: Cost[];
  retainers: Retainer[];
  payrollApprovedOn: string | null;
  asOf: string;
};

const inv = (id: string, client: string, project: string, amount: number, issued: string, due: string, paid = 0, paidOn: string | null = null): Invoice =>
  ({ id, client, project, amount, issued, due, paid, paidOn, reminded: null });

export const SAMPLE_BOOKS: Books = {
  asOf: AS_OF,
  payrollApprovedOn: null,
  accounts: [
    { id: "operating", name: "Operating", bank: "Saltmarsh Credit Union ·2210", balance: 61400, counted: true },
    { id: "buffer", name: "Buffer", bank: "Lighthouse Savings ·0871", balance: 40000, counted: true },
    { id: "tax", name: "Tax reserve", bank: "Lighthouse Savings ·0872", balance: 22000, counted: false },
  ],
  invoices: [
    inv("SR-0412", "Tidewater Press", "Spring catalogue identity", 12400, "2026-09-13", "2026-10-13"),
    inv("SR-0419", "Northgate Housing", "Wayfinding system, phase 2", 14800, "2026-10-03", "2026-11-02"),
    inv("SR-0423", "Kestrel Coffee", "Packaging refresh, final", 4000, "2026-10-13", "2026-11-12"),
    inv("SR-0427", "Penhaligon & Dyer", "Annual report layout", 9600, "2026-10-31", "2026-11-30"),
    inv("SR-0428", "Lantern Theatre", "Season poster set", 6200, "2026-11-04", "2026-12-04"),
    inv("SR-0430", "Marlowe Wines", "Label system", 11500, "2026-11-11", "2026-12-11"),
    inv("SR-0431", "Northgate Housing", "Wayfinding, phase 3 deposit", 7400, "2026-11-18", "2026-12-18"),
    inv("SR-0433", "Halden Lab", "Website build, milestone 2", 12000, "2026-11-20", "2027-01-08"),
    inv("SR-0405", "Kestrel Coffee", "Packaging refresh, deposit", 6000, "2026-10-04", "2026-11-03", 6000, "2026-11-06"),
    inv("SR-0408", "Lantern Theatre", "Brand guidelines", 5400, "2026-09-29", "2026-10-29", 5400, "2026-10-29"),
    inv("SR-0410", "Halden Lab", "Website build, milestone 1", 12000, "2026-10-21", "2026-11-20", 12000, "2026-11-20"),
    inv("SR-0402", "Tidewater Press", "Catalogue pre-press", 3800, "2026-09-14", "2026-10-14", 3800, "2026-10-14"),
  ],
  people: [
    { id: "p1", name: "Nadia Brandt", role: "Founder, creative director", kind: "staff", cost: 7200 },
    { id: "p2", name: "Imani Okafor", role: "Design lead", kind: "staff", cost: 6800 },
    { id: "p3", name: "Tomás Reyes", role: "Senior designer", kind: "staff", cost: 6100 },
    { id: "p4", name: "Priya Nair", role: "Motion designer", kind: "staff", cost: 5600 },
    { id: "p5", name: "Jonas Lindqvist", role: "Developer", kind: "staff", cost: 6900 },
    { id: "p6", name: "Wren Ashby", role: "Studio manager", kind: "staff", cost: 4800 },
    { id: "p7", name: "Dara Quill", role: "Illustrator", kind: "freelance", cost: 2950 },
    { id: "p8", name: "Felix Abara", role: "Copywriter", kind: "freelance", cost: 4600 },
  ],
  costs: [
    { id: "c1", name: "Studio rent, Dock Street", monthly: 5200 },
    { id: "c2", name: "Software and fonts", monthly: 1850 },
    { id: "c3", name: "Insurance", monthly: 940 },
    { id: "c4", name: "Accountant", monthly: 650 },
    { id: "c5", name: "Print proofs, courier, coffee", monthly: 1100 },
  ],
  retainers: [
    { id: "r1", client: "Kestrel Coffee", monthly: 9000 },
    { id: "r2", client: "Northgate Housing", monthly: 14000 },
    { id: "r3", client: "Tidewater Press", monthly: 8000 },
    { id: "r4", client: "Marlowe Wines", monthly: 7000 },
  ],
};

export const EMPTY_BOOKS: Books = {
  asOf: AS_OF,
  payrollApprovedOn: null,
  accounts: [
    { id: "operating", name: "Operating", bank: "Saltmarsh Credit Union ·2210", balance: 0, counted: true },
  ],
  invoices: [],
  people: [],
  costs: [],
  retainers: [],
};
