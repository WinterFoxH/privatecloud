/**
 * Metryki systemu — Faza 6 / F7 (UC-DASH).
 */
const express = require('express');
const os = require('os');
const { db } = require('../db');

const router = express.Router();

let activeConnections = 0;

function trackConnection(req, res, next) {
  activeConnections += 1;
  res.on('finish', () => {
    activeConnections = Math.max(0, activeConnections - 1);
  });
  next();
}

function formatUptime(seconds) {
  const s = Math.floor(seconds);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  if (days > 0) return `${days} dni ${hours} h`;
  if (hours > 0) return `${hours} h ${mins} min`;
  return `${mins} min`;
}

function cpuPercent() {
  const cpus = os.cpus().length || 1;
  const load = os.loadavg()[0] || 0;
  return Math.min(100, Math.round((load / cpus) * 100));
}

router.get('/', (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  let diskSummary = { totalCapacityGb: 0, totalUsedGb: 0, disks: [] };
  try {
    const rows = db
      .prepare(`SELECT * FROM disks WHERE status = 'active' ORDER BY added_at ASC`)
      .all();
    diskSummary.disks = rows.map((row) => {
      const capacityGb = Math.round((row.capacity_bytes / 1e9) * 100) / 100;
      const usedGb = Math.round((row.used_bytes / 1e9) * 100) / 100;
      return {
        id: row.id,
        label: row.label,
        capacityGb,
        usedGb,
        status: row.status,
      };
    });
    diskSummary.totalCapacityGb = diskSummary.disks.reduce((s, d) => s + d.capacityGb, 0);
    diskSummary.totalUsedGb = diskSummary.disks.reduce((s, d) => s + d.usedGb, 0);
  } catch {
    // tabela disks może nie istnieć w starych bazach
  }

  res.json({
    metrics: {
      cpuPercent: cpuPercent(),
      ramUsedGb: Math.round((usedMem / 1e9) * 10) / 10,
      ramTotalGb: Math.round((totalMem / 1e9) * 10) / 10,
      uptime: formatUptime(os.uptime()),
      activeConnections,
    },
    pool: diskSummary,
  });
});

module.exports = { router, trackConnection };
