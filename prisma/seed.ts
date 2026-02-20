import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const providers = [
    {
      key: 'nod',
      name: 'NOD B2B',
      description: 'NOD (Network One Distribution) — REST API cu autentificare HMAC-SHA1. Credențiale: NOD_API_USER + NOD_API_KEY',
      enabled: false,
    },
    {
      key: 'elko',
      name: 'ELKO',
      description: 'ELKO Romania — REST API cu Bearer JWT Token. Credențiale: ELKO_API_TOKEN',
      enabled: false,
    },
    {
      key: 'ingram',
      name: 'Ingram Micro 24',
      description: 'Ingram Micro 24 — Feed CSV prin URL cu API Key. Credențiale: IM_API_KEY',
      enabled: false,
    },
    {
      key: 'also',
      name: 'ALSO',
      description: 'ALSO — Feed CSV prin SFTP (SSH port 22). Credențiale: ALSO_FTP_HOST/USER/PASSWORD. Necesită: npm install ssh2-sftp-client',
      enabled: false,
    },
  ]

  for (const p of providers) {
    await prisma.provider.upsert({
      where: { key: p.key },
      update: { name: p.name, description: p.description },
      create: p,
    })
    console.log(`  ✓ Provider: ${p.name}`)
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
