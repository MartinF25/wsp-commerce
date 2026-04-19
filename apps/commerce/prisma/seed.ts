import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed for commerce catalog...\n");

  // ────────────────────────────────────────────────────────────────
  // Categories
  // ────────────────────────────────────────────────────────────────

  const solarzaun = await prisma.category.create({
    data: {
      slug: "solarzaun",
      name: "Solarzaun",
    },
  });

  const skywind = await prisma.category.create({
    data: {
      slug: "skywind",
      name: "SkyWind",
    },
  });

  const accessories = await prisma.category.create({
    data: {
      slug: "zubehor",
      name: "Zubehör & Montage",
    },
  });

  console.log(`✓ Created 3 categories: ${solarzaun.name}, ${skywind.name}, ${accessories.name}\n`);

  // ────────────────────────────────────────────────────────────────
  // direct_purchase: Zubehörpaket
  // ────────────────────────────────────────────────────────────────

  const kabelPackage = await prisma.product.create({
    data: {
      slug: "solarzaun-kabel-paket",
      name: "Solarzaun Kabel & Verbinder Paket",
      description: "Vollständiger Kabelverbindersatz für Solarzaun-Installation",
      product_type: "direct_purchase",
      status: "active",
      category_id: accessories.id,
      price_cents_min_display: 4999, // €49.99
      variants: {
        create: {
          sku: "KABEL-PAKET-001",
          name: "Standard Paket",
          price_cents: 4999, // €49.99
          currency: "EUR",
          stock_quantity: 100,
          attributes: {
            items: "Kabel 2.5mm (100m), Stecker (20x), Verbinder (50x)",
            gauge_mm: 2.5,
            length_m: 100,
          },
        },
      },
      images: {
        create: {
          url: "https://placeholder.com/400x300?text=Kabel+Paket",
          alt: "Solarzaun Kabel & Verbinder Set",
          sort_order: 0,
        },
      },
    },
  });

  console.log(`✓ Created direct_purchase product: ${kabelPackage.name}`);

  // ────────────────────────────────────────────────────────────────
  // direct_purchase: Montagekit
  // ────────────────────────────────────────────────────────────────

  const mountingKit = await prisma.product.create({
    data: {
      slug: "solarzaun-montagekit-basic",
      name: "Montagekit Basic",
      description: "Grundlegender Montagesatz für Solarzaun-Rahmen",
      product_type: "direct_purchase",
      status: "active",
      category_id: accessories.id,
      price_cents_min_display: 7999, // €79.99
      variants: {
        create: {
          sku: "MOUNT-BASIC-001",
          name: "Für 3m Zaun",
          price_cents: 7999, // €79.99
          currency: "EUR",
          stock_quantity: 50,
          attributes: {
            items: "Befestigungssatz, Schrauben, Dichtungen",
            fence_length_m: 3,
          },
        },
      },
      images: {
        create: {
          url: "https://placeholder.com/400x300?text=Montagekit",
          alt: "Montagekit für Solarzaun",
          sort_order: 0,
        },
      },
    },
  });

  console.log(`✓ Created direct_purchase product: ${mountingKit.name}\n`);

  // ────────────────────────────────────────────────────────────────
  // configurable: Solarzaun Set
  // ────────────────────────────────────────────────────────────────

  const solarzaunSet = await prisma.product.create({
    data: {
      slug: "solarzaun-set-konfigurierbar",
      name: "Solarzaun Set [Konfigurierbar]",
      description: "Individuell konfiguriertes Solarzaun-Set: Länge und Farbe wählbar",
      product_type: "configurable",
      status: "active",
      category_id: solarzaun.id,
      price_cents_min_display: 29999, // €299.99
      variants: {
        create: [
          {
            sku: "SZ-3M-ANTHR",
            name: "3m, Anthrazit, 400W",
            price_cents: 29999, // €299.99
            currency: "EUR",
            stock_quantity: 10,
            attributes: {
              length_m: 3,
              color: "Anthrazit",
              power_w: 400,
              modules: 4,
            },
          },
          {
            sku: "SZ-5M-ANTHR",
            name: "5m, Anthrazit, 600W",
            price_cents: 39999, // €399.99
            currency: "EUR",
            stock_quantity: 8,
            attributes: {
              length_m: 5,
              color: "Anthrazit",
              power_w: 600,
              modules: 6,
            },
          },
          {
            sku: "SZ-3M-WHITE",
            name: "3m, Weiß, 400W",
            price_cents: 32999, // €329.99
            currency: "EUR",
            stock_quantity: 5,
            attributes: {
              length_m: 3,
              color: "Weiß",
              power_w: 400,
              modules: 4,
            },
          },
          {
            sku: "SZ-5M-WHITE",
            name: "5m, Weiß, 600W",
            price_cents: 42999, // €429.99
            currency: "EUR",
            stock_quantity: 3,
            attributes: {
              length_m: 5,
              color: "Weiß",
              power_w: 600,
              modules: 6,
            },
          },
        ],
      },
      images: {
        create: [
          {
            url: "https://placeholder.com/400x300?text=Solarzaun+Config",
            alt: "Solarzaun mit Konfigurator",
            sort_order: 0,
          },
        ],
      },
    },
  });

  console.log(`✓ Created configurable product: ${solarzaunSet.name} (4 variants)`);

  // ────────────────────────────────────────────────────────────────
  // configurable: SkyWind NG Basic
  // ────────────────────────────────────────────────────────────────

  const skywindNG = await prisma.product.create({
    data: {
      slug: "skywind-ng-basic",
      name: "SkyWind NG [Konfigurierbar]",
      description: "Kleine Windkraftanlage mit verschiedenen Leistungsklassen",
      product_type: "configurable",
      status: "active",
      category_id: skywind.id,
      price_cents_min_display: 59999, // €599.99
      variants: {
        create: [
          {
            sku: "SKYWIND-5KW",
            name: "5kW Variante",
            price_cents: 59999, // €599.99
            currency: "EUR",
            stock_quantity: 2,
            attributes: {
              power_kw: 5,
              rotor_diameter_m: 3.8,
              hub_height_m: 6,
              annual_yield_kwh: 8500,
            },
          },
          {
            sku: "SKYWIND-10KW",
            name: "10kW Variante",
            price_cents: 99999, // €999.99
            currency: "EUR",
            stock_quantity: 1,
            attributes: {
              power_kw: 10,
              rotor_diameter_m: 5.0,
              hub_height_m: 8,
              annual_yield_kwh: 18000,
            },
          },
        ],
      },
      images: {
        create: [
          {
            url: "https://placeholder.com/400x300?text=SkyWind+NG",
            alt: "SkyWind NG Windkraftanlage",
            sort_order: 0,
          },
        ],
      },
    },
  });

  console.log(`✓ Created configurable product: ${skywindNG.name} (2 variants)\n`);

  // ────────────────────────────────────────────────────────────────
  // inquiry_only: Großanlage
  // ────────────────────────────────────────────────────────────────

  const largeProject = await prisma.product.create({
    data: {
      slug: "solarzaun-großanlage-projekt",
      name: "Solarzaun Großanlage [Projekt]",
      description: "Individuelle Solarzaun-Großanlage für Grundstücke, Höfe und Gewerbeflächen. Anfrage für unverbindliche Planung.",
      product_type: "inquiry_only",
      status: "active",
      category_id: solarzaun.id,
      price_cents_min_display: 300000, // €3000.00 as soft hint
      variants: {
        create: {
          sku: "PROJECT-SOLARZAUN-001",
          name: "Großanlage (Länge & Leistung nach Projet)",
          price_cents: null, // project-based, to be quoted
          currency: "EUR",
          stock_quantity: null,
          attributes: {
            project_scope: "Individuell angepasste Großanlage",
            includes: "Standortprüfung, Planung, Montage, Elektroanbindung",
          },
        },
      },
      images: {
        create: [
          {
            url: "https://placeholder.com/400x300?text=Großanlage+Projekt",
            alt: "Solarzaun Großanlage - Projektanfrage",
            sort_order: 0,
          },
        ],
      },
    },
  });

  console.log(`✓ Created inquiry_only product: ${largeProject.name}`);

  // ────────────────────────────────────────────────────────────────
  // inquiry_only: SkyWind Komplettanlage
  // ────────────────────────────────────────────────────────────────

  const skywindComplete = await prisma.product.create({
    data: {
      slug: "skywind-komplettanlage-projekt",
      name: "SkyWind Komplettanlage [Projekt]",
      description: "Professionelle SkyWind-Windenergielösung mit Fundament, Elektrifizierung und Wartungsvertrag. Anfrage für Planung und Angebot.",
      product_type: "inquiry_only",
      status: "active",
      category_id: skywind.id,
      price_cents_min_display: null, // no indicative price for complex projects
      variants: {
        create: {
          sku: "PROJECT-SKYWIND-001",
          name: "Komplettanlage inkl. Fundament & Elektrik",
          price_cents: null,
          currency: "EUR",
          stock_quantity: null,
          attributes: {
            project_scope: "Individuelle Windanlage mit Planung & Installation",
            includes: "Fundament, Turbine, Elektroanbindung, Überwachung, 5J Service",
          },
        },
      },
      images: {
        create: [
          {
            url: "https://placeholder.com/400x300?text=SkyWind+Komplettanlage",
            alt: "SkyWind Komplettanlage - Projektanfrage",
            sort_order: 0,
          },
        ],
      },
    },
  });

  console.log(`✓ Created inquiry_only product: ${skywindComplete.name}\n`);

  // ────────────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────────────

  const totalProducts = await prisma.product.count();
  const totalVariants = await prisma.productVariant.count();
  const totalCategories = await prisma.category.count();
  const totalImages = await prisma.productImage.count();

  console.log("🌱 Seed complete!");
  console.log(`   - Categories: ${totalCategories}`);
  console.log(`   - Products: ${totalProducts}`);
  console.log(`   - ProductVariants: ${totalVariants}`);
  console.log(`   - ProductImages: ${totalImages}`);
  console.log(
    "\n✓ Catalog database ready for API and Storefront development.\n"
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
