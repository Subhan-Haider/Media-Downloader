import { NextResponse } from 'next/server';
import os from 'os';
import fs from 'fs/promises';

// Next.js config to force dynamic execution so it doesn't cache system metrics
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Memory stats
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // CPU stats
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // OS stats
    const platform = os.platform();
    const release = os.release();
    const uptime = os.uptime();
    
    // Node stats
    const nodeVersion = process.version;

    // Disk space using fs.statfs
    let diskStats = null;
    try {
      const stats = await fs.statfs(process.cwd());
      diskStats = {
        total: stats.blocks * stats.bsize,
        free: stats.bfree * stats.bsize,
        available: stats.bavail * stats.bsize,
      };
    } catch (e) {
      console.warn("Could not read disk stats", e);
    }

    return NextResponse.json({
      success: true,
      data: {
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
        },
        cpu: {
          cores: cpus.length,
          model: cpus[0]?.model || 'Unknown',
          loadAvg,
        },
        os: {
          platform,
          release,
          uptime,
        },
        node: {
          version: nodeVersion,
        },
        disk: diskStats
      }
    });
  } catch (error: any) {
    console.error('Error fetching admin stats', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
