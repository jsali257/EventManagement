import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ---- Departments ----
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: "GIS" },
      update: {},
      create: { name: "GIS", description: "Geographic Information Systems Division", color: "#10B981" },
    }),
    prisma.department.upsert({
      where: { name: "Administration" },
      update: {},
      create: { name: "Administration", description: "Administrative Division", color: "#8B5CF6" },
    }),
    prisma.department.upsert({
      where: { name: "IT" },
      update: {},
      create: { name: "IT", description: "Information Technology Division", color: "#06B6D4" },
    }),
    prisma.department.upsert({
      where: { name: "Public Education" },
      update: {},
      create: { name: "Public Education", description: "Public Education Department", color: "#3B82F6" },
    }),
  ]);

  console.log(`✅ Created ${departments.length} departments`);

  // ---- Event Categories ----
  const categories = await Promise.all([
    prisma.eventCategory.upsert({
      where: { name: "School Visit" },
      update: {},
      create: { name: "School Visit", description: "Educational visits to schools", color: "#3B82F6", icon: "School" },
    }),
    prisma.eventCategory.upsert({
      where: { name: "Community Fair" },
      update: {},
      create: { name: "Community Fair", description: "Community fairs and festivals", color: "#10B981", icon: "Users" },
    }),
    prisma.eventCategory.upsert({
      where: { name: "Fire Safety Demo" },
      update: {},
      create: { name: "Fire Safety Demo", description: "Fire safety demonstrations", color: "#EF4444", icon: "Flame" },
    }),
    prisma.eventCategory.upsert({
      where: { name: "Health & Wellness" },
      update: {},
      create: { name: "Health & Wellness", description: "Health and wellness events", color: "#F59E0B", icon: "Heart" },
    }),
    prisma.eventCategory.upsert({
      where: { name: "Public Presentation" },
      update: {},
      create: { name: "Public Presentation", description: "Public awareness presentations", color: "#8B5CF6", icon: "Presentation" },
    }),
    prisma.eventCategory.upsert({
      where: { name: "Training Exercise" },
      update: {},
      create: { name: "Training Exercise", description: "Training and exercise events", color: "#06B6D4", icon: "Dumbbell" },
    }),
  ]);

  console.log(`✅ Created ${categories.length} event categories`);

  // ---- Admin User ----
  const adminPassword = await bcrypt.hash("Admin@123!", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@department.gov" },
    update: {},
    create: {
      email: "admin@department.gov",
      name: "System Administrator",
      passwordHash: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Created admin user (admin@department.gov / Admin@123!)");

  // ---- Demo Employees ----
  const avatarColors = [
    "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444",
    "#F59E0B", "#10B981", "#06B6D4", "#6366F1",
  ];

  const employeeData = [
    { id: "EMP001", first: "Maria", last: "Garcia", title: "Public Education Coordinator", dept: departments[3].id, color: avatarColors[0] },
    { id: "EMP002", first: "James", last: "Wilson", title: "Community Liaison", dept: departments[1].id, color: avatarColors[1] },
    { id: "EMP003", first: "Sarah", last: "Johnson", title: "GIS Specialist", dept: departments[0].id, color: avatarColors[2] },
    { id: "EMP004", first: "David", last: "Martinez", title: "Outreach Coordinator", dept: departments[3].id, color: avatarColors[3] },
    { id: "EMP005", first: "Jennifer", last: "Brown", title: "Education Specialist", dept: departments[3].id, color: avatarColors[4] },
    { id: "EMP006", first: "Robert", last: "Davis", title: "IT Support Specialist", dept: departments[2].id, color: avatarColors[5] },
    { id: "EMP007", first: "Lisa", last: "Anderson", title: "Program Coordinator", dept: departments[1].id, color: avatarColors[6] },
    { id: "EMP008", first: "Michael", last: "Taylor", title: "GIS Analyst", dept: departments[0].id, color: avatarColors[7] },
  ];

  const employees = [];
  for (const emp of employeeData) {
    const email = `${emp.first.toLowerCase()}.${emp.last.toLowerCase()}@department.gov`;
    const password = await bcrypt.hash("Employee@123!", 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `${emp.first} ${emp.last}`,
        passwordHash: password,
        role: "EMPLOYEE",
        isActive: true,
      },
    });

    const employee = await prisma.employee.upsert({
      where: { employeeId: emp.id },
      update: {},
      create: {
        employeeId: emp.id,
        firstName: emp.first,
        lastName: emp.last,
        email,
        jobTitle: emp.title,
        departmentId: emp.dept,
        status: "AVAILABLE",
        avatarColor: emp.color,
        userId: user.id,
        volunteerHours: Math.floor(Math.random() * 80),
        eventsAttended: Math.floor(Math.random() * 20),
        attendanceRate: Math.random() * 30 + 70,
        volunteerScore: Math.floor(Math.random() * 40) + 60,
      },
    });

    // Link employee to user
    await prisma.user.update({
      where: { id: user.id },
      data: {},
    });

    employees.push(employee);
  }

  console.log(`✅ Created ${employees.length} employees`);

  // ---- Sample Events ----
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sampleEvents = [
    {
      title: "Lincoln Elementary Fire Safety Day",
      description: "Annual fire safety demonstration for K-5 students. Includes fire truck display and safety tips.",
      categoryId: categories[2].id,
      date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      startTime: "09:00",
      endTime: "12:00",
      location: "Lincoln Elementary School",
      address: "123 Lincoln Ave, Springfield",
      maxVolunteers: 4,
      organizerId: employees[0].id,
    },
    {
      title: "Community Health Fair",
      description: "Annual community health fair with free screenings and educational materials.",
      categoryId: categories[1].id,
      date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      startTime: "10:00",
      endTime: "16:00",
      location: "City Park Pavilion",
      address: "456 Park Drive, Springfield",
      maxVolunteers: 6,
      organizerId: employees[1].id,
    },
    {
      title: "High School Career Day",
      description: "Presenting public safety careers to high school students.",
      categoryId: categories[4].id,
      date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
      startTime: "08:00",
      endTime: "15:00",
      location: "Springfield High School",
      address: "789 School Blvd, Springfield",
      maxVolunteers: 3,
      organizerId: employees[2].id,
    },
    {
      title: "Senior Center Safety Presentation",
      description: "Home safety and fall prevention presentation for senior residents.",
      categoryId: categories[4].id,
      date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      startTime: "13:00",
      endTime: "15:00",
      location: "Springfield Senior Center",
      address: "321 Elder Way, Springfield",
      maxVolunteers: 2,
      organizerId: employees[3].id,
    },
    {
      title: "County Fair Booth",
      description: "Public education booth at the annual county fair. Distributing safety materials.",
      categoryId: categories[1].id,
      date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000),
      startTime: "10:00",
      endTime: "18:00",
      location: "County Fairgrounds",
      address: "555 Fairground Rd, Springfield",
      maxVolunteers: 5,
      organizerId: employees[0].id,
    },
  ];

  for (const eventData of sampleEvents) {
    const event = await prisma.event.create({
      data: {
        ...eventData,
        status: "UPCOMING",
        createdById: adminUser.id,
      },
    });

    // Add some volunteer assignments
    const numVolunteers = Math.min(
      Math.floor(Math.random() * (eventData.maxVolunteers - 1)) + 1,
      employees.length
    );
    const shuffled = [...employees].sort(() => Math.random() - 0.5);
    const assignedEmployees = shuffled.slice(0, numVolunteers);

    for (const emp of assignedEmployees) {
      await prisma.eventAssignment.create({
        data: {
          eventId: event.id,
          employeeId: emp.id,
          assignedById: adminUser.id,
        },
      }).catch(() => null);
    }
  }

  console.log(`✅ Created ${sampleEvents.length} sample events with volunteer assignments`);

  // ---- App Settings ----
  const settings = [
    { key: "app.name", value: "Community Outreach & Volunteer Management System", description: "Application display name" },
    { key: "app.department", value: "Public Education Department", description: "Department name" },
    { key: "app.timezone", value: "America/Chicago", description: "Default timezone" },
    { key: "upload.maxSizeMB", value: "25", description: "Maximum file upload size in MB" },
    { key: "upload.provider", value: "local", description: "File upload provider (local/uploadthing)" },
    { key: "notifications.enabled", value: "true", description: "Enable in-app notifications" },
  ];

  for (const setting of settings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log(`✅ Created ${settings.length} app settings`);

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin:    admin@department.gov / Admin@123!");
  console.log("   Employee: maria.garcia@department.gov / Employee@123!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
