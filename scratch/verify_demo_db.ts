import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('=== VERIFYING DATABASE STATE ===');
  const count = await prisma.lesson.count();
  const draftCount = await prisma.lesson.count({ where: { publishStatus: 'draft' } });
  const publishedCount = await prisma.lesson.count({ where: { publishStatus: 'published' } });
  const readyCount = await prisma.lesson.count({ where: { contentStatus: 'ready' } });

  console.log(`Total lessons: ${count}`);
  console.log(`Draft lessons: ${draftCount}`);
  console.log(`Published lessons: ${publishedCount}`);
  console.log(`Ready lessons: ${readyCount}`);

  const demoLessons = await prisma.lesson.findMany({
    where: { id: { in: ['D-MM-A-01', 'D-MM-A-03'] } },
    include: {
      content: true,
      rawContent: true,
    },
    orderBy: { id: 'asc' },
  });

  for (const l of demoLessons) {
    console.log(`\n---------------------------------------------------------`);
    console.log(`Lesson ID: ${l.id} | Title: ${l.title}`);
    console.log(`Publish Status: ${l.publishStatus} | Content Status: ${l.contentStatus}`);
    const blocks = (l.content?.contentJson as any)?.blocks || [];
    console.log(`Blocks Count: ${blocks.length}`);
    console.log(`Sample Blocks:`);
    blocks.slice(0, 5).forEach((b: any) => console.log(`  [${b.type}] ${b.text || (b.items ? b.items.join(', ') : '')}`));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
