import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();

  try {
    // ── Owner User ──────────────────────────────────────
    const ownerEmail = process.env.SEED_OWNER_EMAIL || 'owner@metalworks.com';
    const ownerPassword = process.env.SEED_OWNER_PASSWORD || 'owner123456';

    const existingOwner = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (!existingOwner) {
      const ownerHash = await bcrypt.hash(ownerPassword, 12);
      const owner = await prisma.user.create({
        data: {
          name: 'Plant Owner',
          email: ownerEmail,
          passwordHash: ownerHash,
          role: 'owner',
          active: true,
        },
      });
      console.log(`✓ Owner created: ${owner.email} (${owner.id})`);
    } else {
      console.log(`✓ Owner already exists (${ownerEmail}), skipping.`);
    }

    // ── Viewer User ─────────────────────────────────────
    const viewerEmail = 'viewer@metalworks.com';
    const existingViewer = await prisma.user.findUnique({ where: { email: viewerEmail } });
    if (!existingViewer) {
      const viewerHash = await bcrypt.hash('viewer123456', 12);
      const viewer = await prisma.user.create({
        data: {
          name: 'Floor Viewer',
          email: viewerEmail,
          passwordHash: viewerHash,
          role: 'viewer',
          active: true,
        },
      });
      console.log(`✓ Viewer created: ${viewer.email} (${viewer.id})`);
    } else {
      console.log(`✓ Viewer already exists (${viewerEmail}), skipping.`);
    }

    // ── Sample Inventory Items ──────────────────────────
    const itemCount = await prisma.inventoryItem.count();
    if (itemCount === 0) {
      const items = await Promise.all([
        prisma.inventoryItem.create({
          data: { name: 'Aluminum Sheets 4x8', itemType: 'raw_material', unitOfMeasure: 'sheets', lowStockThreshold: 50 },
        }),
        prisma.inventoryItem.create({
          data: { name: 'Steel Rods 12mm', itemType: 'raw_material', unitOfMeasure: 'pieces', lowStockThreshold: 100 },
        }),
        prisma.inventoryItem.create({
          data: { name: 'Copper Wire Spool', itemType: 'raw_material', unitOfMeasure: 'spools', lowStockThreshold: 20 },
        }),
        prisma.inventoryItem.create({
          data: { name: 'Welding Gas Cylinder', itemType: 'raw_material', unitOfMeasure: 'cylinders', lowStockThreshold: 10 },
        }),
        prisma.inventoryItem.create({
          data: { name: 'Aluminum Frame Assembly', itemType: 'finished_good', unitOfMeasure: 'units', lowStockThreshold: 15 },
        }),
        prisma.inventoryItem.create({
          data: { name: 'Custom Metal Panel', itemType: 'finished_good', unitOfMeasure: 'panels', lowStockThreshold: 25 },
        }),
      ]);
      console.log(`✓ Created ${items.length} sample inventory items`);

      // Add initial stock movements for raw materials
      const owner = await prisma.user.findFirst({ where: { role: 'owner' } });
      if (owner) {
        const movements = await Promise.all([
          prisma.stockMovement.create({
            data: { itemId: items[0].id, movementType: 'receipt', quantity: 200, recordedBy: owner.id, referenceType: 'manual', notes: 'Initial stock load' },
          }),
          prisma.stockMovement.create({
            data: { itemId: items[1].id, movementType: 'receipt', quantity: 350, recordedBy: owner.id, referenceType: 'manual', notes: 'Initial stock load' },
          }),
          prisma.stockMovement.create({
            data: { itemId: items[2].id, movementType: 'receipt', quantity: 45, recordedBy: owner.id, referenceType: 'manual', notes: 'Initial stock load' },
          }),
          prisma.stockMovement.create({
            data: { itemId: items[3].id, movementType: 'receipt', quantity: 30, recordedBy: owner.id, referenceType: 'manual', notes: 'Initial stock load' },
          }),
          prisma.stockMovement.create({
            data: { itemId: items[4].id, movementType: 'receipt', quantity: 40, recordedBy: owner.id, referenceType: 'manual', notes: 'Initial finished goods' },
          }),
          prisma.stockMovement.create({
            data: { itemId: items[5].id, movementType: 'receipt', quantity: 60, recordedBy: owner.id, referenceType: 'manual', notes: 'Initial finished goods' },
          }),
        ]);
        console.log(`✓ Created ${movements.length} initial stock movements`);
      }
    } else {
      console.log(`✓ Inventory items already exist (${itemCount}), skipping.`);
    }

    // ── Sample Customer ─────────────────────────────────
    const customerCount = await prisma.customer.count();
    if (customerCount === 0) {
      const customers = await Promise.all([
        prisma.customer.create({
          data: { name: 'Apex Construction LLC', contactInfo: 'john@apexconstruction.com | (555) 123-4567' },
        }),
        prisma.customer.create({
          data: { name: 'MetroFrame Industries', contactInfo: 'orders@metroframe.com | (555) 987-6543' },
        }),
        prisma.customer.create({
          data: { name: 'SkyBuild Partners', contactInfo: 'procurement@skybuild.com | (555) 456-7890' },
        }),
      ]);
      console.log(`✓ Created ${customers.length} sample customers`);
    } else {
      console.log(`✓ Customers already exist (${customerCount}), skipping.`);
    }

    console.log('\n🏭 Database seeded successfully!\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
