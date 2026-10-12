import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

async function main() {
  const jsonPath = path.resolve(
    "SenTrang_Gravity_Handoff_V1_3/SenTrang_Gravity_Handoff_V1_3/02_MASTER_DATA/SenTrang_MasterData_NganhDong_V1_2.json"
  );
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const lessonJson = raw.lessons.find((l: any) => l.id === "D-MM-A-02");

  console.log("=== 1. MASTER DATA V1.2 (JSON FILE) ===");
  console.log({
    id: lessonJson?.id,
    title: lessonJson?.title,
    slug: lessonJson?.slug,
    sequence: lessonJson?.sequence,
    category_id: lessonJson?.category_id,
    level_id: lessonJson?.level_id,
  });

  const mainPrisma = new PrismaClient({
    datasources: { db: { url: "postgresql://postgres:postgres@127.0.0.1:5434/sentrang?sslmode=disable" } }
  });
  const mainLesson = await mainPrisma.lesson.findUnique({ where: { id: "D-MM-A-02" } });
  console.log("\n=== 2. MAIN DATABASE (sentrang) ===");
  console.log({
    id: mainLesson?.id,
    title: mainLesson?.title,
    slug: mainLesson?.slug,
    sequence: mainLesson?.sequence,
    publishStatus: mainLesson?.publishStatus,
    contentStatus: mainLesson?.contentStatus,
  });

  const testPrisma = new PrismaClient({
    datasources: { db: { url: "postgresql://postgres:postgres@127.0.0.1:5434/sentrang_test?sslmode=disable" } }
  });
  const testLesson = await testPrisma.lesson.findUnique({ where: { id: "D-MM-A-02" } });
  console.log("\n=== 3. DEMO DATABASE (sentrang_test) ===");
  console.log({
    id: testLesson?.id,
    title: testLesson?.title,
    slug: testLesson?.slug,
    sequence: testLesson?.sequence,
    publishStatus: testLesson?.publishStatus,
    contentStatus: testLesson?.contentStatus,
  });

  await mainPrisma.$disconnect();
  await testPrisma.$disconnect();
}

main().catch(console.error);
