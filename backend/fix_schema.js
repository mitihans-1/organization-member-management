const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Fix opposite relations in User
schema = schema.replace(
  '  @@map("users")',
  '  idCards               IdCard[]\n  idCardRequests        IdCardRequest[]\n  idCardVerificationLogs IdCardVerificationLog[]\n\n  @@map("users")'
);

// Fix opposite relations in Organization
schema = schema.replace(
  '  @@map("organizations")',
  '  idCards               IdCard[]\n  idCardRequests        IdCardRequest[]\n  idCardVerificationLogs IdCardVerificationLog[]\n\n  @@map("organizations")'
);

// Fix missing @map("_id") for @id @default(cuid())
schema = schema.replace(/@id @default\(cuid\(\)\)/g, '@id @default(cuid()) @map("_id")');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log("Schema fixed!");
