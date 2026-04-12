/**
 * Seed Script — run once to bootstrap the building data.
 * Usage:  node server/scripts/seedBuildings.js
 *
 * Requires MONGO_URI in .env (root level)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Building = require('../models/Building');

// MANIT Bhopal Campus Buildings Seed Data
// Formatted for the Flat Schema (cascading dropdowns)

const manitBuildings = [
  // ── ACADEMIC & ADMINISTRATIVE BUILDINGS ─────────────────────────────────
  {
    name: "Main Institute Building",
    blocks: ["Block A", "Block B", "Block C", "Block D", "Block J", "None"],
    floors: ["Ground Floor", "First Floor", "Second Floor"],
    areaTypes: ["Office", "Classroom", "Lab", "Washroom", "Corridor", "Faculty Cabin", "Staircase", "Water Cooler Area"],
    isActive: true
  },
  {
    name: "New Teaching Block (NTB)",
    blocks: ["Block A", "Block B", "Block C", "Block D", "None"],
    floors: ["Ground Floor", "First Floor", "Second Floor", "Third Floor", "Fourth Floor"],
    areaTypes: ["Classroom", "Lecture Hall", "Washroom", "Corridor", "Faculty Cabin", "Staircase", "Elevator Lobby"],
    isActive: true
  },
  {
    name: "Central Computing Facility (CCF)",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor"],
    areaTypes: ["Computer Lab", "Server Room", "Office", "Washroom", "Corridor", "Staircase"],
    isActive: true
  },
  {
    name: "Central Research Facility (CRF)",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor", "Second Floor"],
    areaTypes: ["Research Lab", "Equipment Room", "Washroom", "Corridor", "Faculty Cabin", "Staircase"],
    isActive: true
  },
  {
    name: "Energy Centre",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor"],
    areaTypes: ["Lab", "Classroom", "Office", "Washroom", "Corridor"],
    isActive: true
  },
  {
    name: "Central Library",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor", "Second Floor"],
    areaTypes: ["Reading Room", "Stack Area", "Digital Library", "Washroom", "Corridor", "Office", "Staircase"],
    isActive: true
  },

  // ── AMENITIES & SUPPORT FACILITIES ──────────────────────────────────────
  {
    name: "Dr. S. Radhakrishnan Auditorium",
    blocks: ["None"],
    floors: ["Ground Floor", "Balcony"],
    areaTypes: ["Main Hall", "Stage", "Green Room", "Control Room", "Washroom", "Lobby", "Corridor"],
    isActive: true
  },
  {
    name: "ROLTA Incubation Centre",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor"],
    areaTypes: ["Incubation Space", "Meeting Room", "Office", "Washroom", "Corridor"],
    isActive: true
  },
  {
    name: "Student Activity Centre (SAC) & Sports Complex",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor"],
    areaTypes: ["Indoor Court", "Gymnasium", "Meditation Hall", "Office", "Washroom", "Corridor", "Store Room"],
    isActive: true
  },
  {
    name: "Institute Dispensary",
    blocks: ["None"],
    floors: ["Ground Floor"],
    areaTypes: ["Doctor Cabin", "Ward", "Pharmacy", "Waiting Area", "Washroom", "Corridor"],
    isActive: true
  },
  {
    name: "Workshops",
    blocks: ["Carpentry Shop", "Welding Shop", "Machine Shop", "Foundry", "None"],
    floors: ["Ground Floor"],
    areaTypes: ["Work Area", "Tool Room", "Office", "Washroom"],
    isActive: true
  },

  // ── RESIDENTIAL HOSTELS ─────────────────────────────────────────────────
  // A standard template applies to most hostels, except those with specific blocks
  {
    name: "Hostel No 1 (Homi Jehangir Bhabha Bhawan)",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor", "Second Floor", "Third Floor"],
    areaTypes: ["Student Room", "Washroom", "Corridor", "Mess", "Common Room", "Staircase", "Water Cooler Area"],
    isActive: true
  },
  {
    name: "Hostel No 2 (Vikram Sarabhai Bhawan)",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor", "Second Floor", "Third Floor"],
    areaTypes: ["Student Room", "Washroom", "Corridor", "Mess", "Common Room", "Staircase", "Water Cooler Area"],
    isActive: true
  },
  {
    name: "Hostel No 3",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor", "Second Floor", "Third Floor"],
    areaTypes: ["Student Room", "Washroom", "Corridor", "Mess", "Common Room", "Staircase"],
    isActive: true
  },
  {
    name: "Hostel No 4",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor", "Second Floor", "Third Floor"],
    areaTypes: ["Student Room", "Washroom", "Corridor", "Mess", "Common Room", "Staircase"],
    isActive: true
  },
  {
    name: "Hostel No 5 (Mokshagundam Visvesvarayya Bhawan)",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor", "Second Floor", "Third Floor"],
    areaTypes: ["Student Room", "Washroom", "Corridor", "Mess", "Common Room", "Staircase"],
    isActive: true
  },
  {
    name: "Hostel No 6 (Jagadish Chandra Bose Bhawan)",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor", "Second Floor", "Third Floor"],
    areaTypes: ["Student Room", "Washroom", "Corridor", "Mess", "Common Room", "Staircase"],
    isActive: true
  },
  {
    name: "Hostel No 7 (Kalpana Chawla Bhawan) - Girls",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor", "Second Floor", "Third Floor"],
    areaTypes: ["Student Room", "Washroom", "Corridor", "Mess", "Common Room", "Staircase"],
    isActive: true
  },
  {
    name: "Hostel No 8 (Ramanujan Bhavan)",
    blocks: ["Block A", "Block B", "None"], // Specifically listed as having blocks A and B
    floors: ["Ground Floor", "First Floor", "Second Floor", "Third Floor"],
    areaTypes: ["Student Room", "Washroom", "Corridor", "Mess", "Common Room", "Staircase", "Guest Room"],
    isActive: true
  },
  {
    name: "Hostel No 9 (Raja Ramanna Bhawan)",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor", "Second Floor", "Third Floor", "Fourth Floor"],
    areaTypes: ["Student Room", "Washroom", "Corridor", "Mess", "Common Room", "Staircase", "Elevator Lobby"],
    isActive: true
  },
  {
    name: "Hostel No 10",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor", "Second Floor", "Third Floor", "Fourth Floor"],
    areaTypes: ["Student Room", "Washroom", "Corridor", "Mess", "Common Room", "Staircase"],
    isActive: true
  },
  {
    name: "Hostel No 11",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor", "Second Floor", "Third Floor"],
    areaTypes: ["Student Room", "Washroom", "Corridor", "Mess", "Common Room", "Staircase"],
    isActive: true
  },
  {
    name: "Hostel No 12 (Bhagini Nivedita Bhavan) - Girls",
    blocks: ["None"],
    floors: ["Ground Floor", "First Floor", "Second Floor", "Third Floor"],
    areaTypes: ["Student Room", "Washroom", "Corridor", "Mess", "Common Room", "Staircase"],
    isActive: true
  }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing buildings to avoid duplicates (optional, comment out if not desired)
    // await Building.deleteMany({});
    // console.log('Deleted existing buildings');

    const result = await Building.insertMany(manitBuildings);
    console.log(`✅ Seeded ${result.length} buildings successfully.`);
    process.exit(0);
  } catch (err) {
    if (err.code === 11000) {
       console.error('❌ Seed failed: Duplicate building name. Delete existing entries first.');
    } else {
       console.error('❌ Seed failed:', err.message);
    }
    process.exit(1);
  }
})();
