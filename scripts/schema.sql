/*
  Marvel Rocks Society — SQL Server DDL (28 tables)

  Run in SSMS against the mygatesociety database, or let setup.ps1 / seed.py
  create tables automatically via SQLAlchemy.

  1. Create database (if needed):
       IF DB_ID(N'mygatesociety') IS NULL CREATE DATABASE [mygatesociety];
  2. USE [mygatesociety];
  3. Execute this script.
*/

USE [mygatesociety];
GO

IF OBJECT_ID(N'dbo.Society', N'U') IS NULL
CREATE TABLE dbo.Society (
    id                      NVARCHAR(32)  NOT NULL PRIMARY KEY,
    name                    NVARCHAR(255) NOT NULL,
    associationName         NVARCHAR(255) NOT NULL,
    address                 NVARCHAR(1000) NULL,
    totalFlats              INT           NOT NULL DEFAULT 90,
    maintenanceAmountPerFlat FLOAT        NOT NULL DEFAULT 1200,
    createdAt               DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'dbo.Flat', N'U') IS NULL
CREATE TABLE dbo.Flat (
    id            NVARCHAR(32)  NOT NULL PRIMARY KEY,
    label         NVARCHAR(50)  NOT NULL,
    floor         INT           NOT NULL,
    unit          INT           NOT NULL,
    isMerged      BIT           NOT NULL DEFAULT 0,
    physicalUnits NVARCHAR(50)  NULL,
    societyId     NVARCHAR(32)  NOT NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Flat_label' AND object_id = OBJECT_ID(N'dbo.Flat'))
    CREATE UNIQUE INDEX IX_Flat_label ON dbo.Flat(label);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Flat_societyId' AND object_id = OBJECT_ID(N'dbo.Flat'))
    CREATE INDEX IX_Flat_societyId ON dbo.Flat(societyId);
GO

IF OBJECT_ID(N'dbo.[User]', N'U') IS NULL
CREATE TABLE dbo.[User] (
    id                   NVARCHAR(32)  NOT NULL PRIMARY KEY,
    email                NVARCHAR(255) NULL,
    passwordHash         NVARCHAR(255) NOT NULL,
    name                 NVARCHAR(255) NOT NULL,
    phone                NVARCHAR(50)  NOT NULL,
    role                 NVARCHAR(50)  NOT NULL DEFAULT N'RESIDENT',
    residentType         NVARCHAR(50)  NULL,
    committeeRole        NVARCHAR(50)  NULL,
    isMainAdmin          BIT           NOT NULL DEFAULT 0,
    mustChangePassword   BIT           NOT NULL DEFAULT 1,
    tenantOwnerName      NVARCHAR(255) NULL,
    tenantOwnerPhone     NVARCHAR(50)  NULL,
    tenantOwnerFlatLabel NVARCHAR(50)  NULL,
    flatId               NVARCHAR(32)  NULL,
    societyId            NVARCHAR(32)  NOT NULL,
    createdAt            DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_User_email' AND object_id = OBJECT_ID(N'dbo.[User]'))
    CREATE UNIQUE INDEX IX_User_email ON dbo.[User](email) WHERE email IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_User_phone' AND object_id = OBJECT_ID(N'dbo.[User]'))
    CREATE UNIQUE INDEX IX_User_phone ON dbo.[User](phone);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_User_role' AND object_id = OBJECT_ID(N'dbo.[User]'))
    CREATE INDEX IX_User_role ON dbo.[User](role);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_User_flatId' AND object_id = OBJECT_ID(N'dbo.[User]'))
    CREATE INDEX IX_User_flatId ON dbo.[User](flatId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_User_societyId' AND object_id = OBJECT_ID(N'dbo.[User]'))
    CREATE INDEX IX_User_societyId ON dbo.[User](societyId);
GO

IF OBJECT_ID(N'dbo.VisitorPass', N'U') IS NULL
CREATE TABLE dbo.VisitorPass (
    id           NVARCHAR(32)  NOT NULL PRIMARY KEY,
    guestName    NVARCHAR(255) NOT NULL,
    guestPhone   NVARCHAR(50)  NULL,
    purpose      NVARCHAR(500) NULL,
    vehicleNo    NVARCHAR(50)  NULL,
    guestType    NVARCHAR(50)  NOT NULL DEFAULT N'GUEST',
    visitDate    DATETIME2     NOT NULL,
    validFrom    DATETIME2     NOT NULL,
    validUntil   DATETIME2     NOT NULL,
    otp          NVARCHAR(20)  NOT NULL,
    status       NVARCHAR(50)  NOT NULL DEFAULT N'APPROVED',
    flatId       NVARCHAR(32)  NOT NULL,
    createdById  NVARCHAR(32)  NOT NULL,
    checkedInAt  DATETIME2     NULL,
    checkedOutAt DATETIME2     NULL,
    gateNotes    NVARCHAR(1000) NULL,
    createdAt    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VisitorPass_flatId' AND object_id = OBJECT_ID(N'dbo.VisitorPass'))
    CREATE INDEX IX_VisitorPass_flatId ON dbo.VisitorPass(flatId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VisitorPass_createdById' AND object_id = OBJECT_ID(N'dbo.VisitorPass'))
    CREATE INDEX IX_VisitorPass_createdById ON dbo.VisitorPass(createdById);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VisitorPass_otp_status' AND object_id = OBJECT_ID(N'dbo.VisitorPass'))
    CREATE INDEX IX_VisitorPass_otp_status ON dbo.VisitorPass(otp, status);
GO

IF OBJECT_ID(N'dbo.DeliveryPass', N'U') IS NULL
CREATE TABLE dbo.DeliveryPass (
    id          NVARCHAR(32)  NOT NULL PRIMARY KEY,
    company     NVARCHAR(255) NOT NULL,
    description NVARCHAR(500) NULL,
    otp         NVARCHAR(20)  NOT NULL,
    mode        NVARCHAR(50)  NOT NULL DEFAULT N'ALLOW_ENTRY',
    status      NVARCHAR(50)  NOT NULL DEFAULT N'PENDING',
    flatId      NVARCHAR(32)  NOT NULL,
    createdById NVARCHAR(32)  NOT NULL,
    createdAt   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    deliveredAt DATETIME2     NULL,
    collectedAt DATETIME2     NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DeliveryPass_flatId' AND object_id = OBJECT_ID(N'dbo.DeliveryPass'))
    CREATE INDEX IX_DeliveryPass_flatId ON dbo.DeliveryPass(flatId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DeliveryPass_createdById' AND object_id = OBJECT_ID(N'dbo.DeliveryPass'))
    CREATE INDEX IX_DeliveryPass_createdById ON dbo.DeliveryPass(createdById);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DeliveryPass_otp_status' AND object_id = OBJECT_ID(N'dbo.DeliveryPass'))
    CREATE INDEX IX_DeliveryPass_otp_status ON dbo.DeliveryPass(otp, status);
GO

IF OBJECT_ID(N'dbo.Notice', N'U') IS NULL
CREATE TABLE dbo.Notice (
    id          NVARCHAR(32)  NOT NULL PRIMARY KEY,
    title       NVARCHAR(500) NOT NULL,
    body        NVARCHAR(4000) NOT NULL,
    pinned      BIT           NOT NULL DEFAULT 0,
    targetGroup NVARCHAR(100) NULL,
    societyId   NVARCHAR(32)  NOT NULL,
    authorId    NVARCHAR(32)  NOT NULL,
    createdAt   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Notice_societyId' AND object_id = OBJECT_ID(N'dbo.Notice'))
    CREATE INDEX IX_Notice_societyId ON dbo.Notice(societyId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Notice_authorId' AND object_id = OBJECT_ID(N'dbo.Notice'))
    CREATE INDEX IX_Notice_authorId ON dbo.Notice(authorId);
GO

IF OBJECT_ID(N'dbo.Complaint', N'U') IS NULL
CREATE TABLE dbo.Complaint (
    id        NVARCHAR(32)  NOT NULL PRIMARY KEY,
    subject   NVARCHAR(500) NOT NULL,
    body      NVARCHAR(4000) NOT NULL,
    category  NVARCHAR(100) NOT NULL DEFAULT N'General',
    status    NVARCHAR(50)  NOT NULL DEFAULT N'OPEN',
    flatId    NVARCHAR(32)  NOT NULL,
    userId    NVARCHAR(32)  NOT NULL,
    adminNote NVARCHAR(2000) NULL,
    createdAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Complaint_flatId' AND object_id = OBJECT_ID(N'dbo.Complaint'))
    CREATE INDEX IX_Complaint_flatId ON dbo.Complaint(flatId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Complaint_userId' AND object_id = OBJECT_ID(N'dbo.Complaint'))
    CREATE INDEX IX_Complaint_userId ON dbo.Complaint(userId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Complaint_status' AND object_id = OBJECT_ID(N'dbo.Complaint'))
    CREATE INDEX IX_Complaint_status ON dbo.Complaint(status);
GO

IF OBJECT_ID(N'dbo.DomesticStaff', N'U') IS NULL
CREATE TABLE dbo.DomesticStaff (
    id          NVARCHAR(32)  NOT NULL PRIMARY KEY,
    name        NVARCHAR(255) NOT NULL,
    phone       NVARCHAR(50)  NULL,
    staffType   NVARCHAR(100) NOT NULL,
    idProof     NVARCHAR(255) NULL,
    photoUrl    NVARCHAR(500) NULL,
    flatId      NVARCHAR(32)  NOT NULL,
    createdById NVARCHAR(32)  NOT NULL,
    active      BIT           NOT NULL DEFAULT 1,
    passcode    NVARCHAR(20)  NOT NULL,
    createdAt   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DomesticStaff_flatId' AND object_id = OBJECT_ID(N'dbo.DomesticStaff'))
    CREATE INDEX IX_DomesticStaff_flatId ON dbo.DomesticStaff(flatId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DomesticStaff_createdById' AND object_id = OBJECT_ID(N'dbo.DomesticStaff'))
    CREATE INDEX IX_DomesticStaff_createdById ON dbo.DomesticStaff(createdById);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DomesticStaff_passcode' AND object_id = OBJECT_ID(N'dbo.DomesticStaff'))
    CREATE UNIQUE INDEX IX_DomesticStaff_passcode ON dbo.DomesticStaff(passcode);
GO

IF OBJECT_ID(N'dbo.StaffAttendance', N'U') IS NULL
CREATE TABLE dbo.StaffAttendance (
    id         NVARCHAR(32)  NOT NULL PRIMARY KEY,
    staffId    NVARCHAR(32)  NOT NULL,
    date       DATETIME2     NOT NULL,
    checkIn    DATETIME2     NULL,
    checkOut   DATETIME2     NULL,
    verifiedBy NVARCHAR(100) NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_StaffAttendance_staffId' AND object_id = OBJECT_ID(N'dbo.StaffAttendance'))
    CREATE INDEX IX_StaffAttendance_staffId ON dbo.StaffAttendance(staffId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_StaffAttendance_date' AND object_id = OBJECT_ID(N'dbo.StaffAttendance'))
    CREATE INDEX IX_StaffAttendance_date ON dbo.StaffAttendance(date);
GO

IF OBJECT_ID(N'dbo.Vehicle', N'U') IS NULL
CREATE TABLE dbo.Vehicle (
    id        NVARCHAR(32)  NOT NULL PRIMARY KEY,
    number    NVARCHAR(50)  NOT NULL,
    type      NVARCHAR(50)  NOT NULL DEFAULT N'Car',
    color     NVARCHAR(50)  NULL,
    stickerNo NVARCHAR(50)  NULL,
    flatId    NVARCHAR(32)  NOT NULL,
    createdAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Vehicle_flatId' AND object_id = OBJECT_ID(N'dbo.Vehicle'))
    CREATE INDEX IX_Vehicle_flatId ON dbo.Vehicle(flatId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Vehicle_number' AND object_id = OBJECT_ID(N'dbo.Vehicle'))
    CREATE INDEX IX_Vehicle_number ON dbo.Vehicle(number);
GO

IF OBJECT_ID(N'dbo.MaintenanceBill', N'U') IS NULL
CREATE TABLE dbo.MaintenanceBill (
    id          NVARCHAR(32)  NOT NULL PRIMARY KEY,
    flatId      NVARCHAR(32)  NOT NULL,
    month       NVARCHAR(20)  NOT NULL,
    amount      FLOAT         NOT NULL,
    description NVARCHAR(500) NULL,
    status      NVARCHAR(50)  NOT NULL DEFAULT N'UNPAID',
    dueDate     DATETIME2     NOT NULL,
    paidAt      DATETIME2     NULL,
    createdAt   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_MaintenanceBill_flatId_month UNIQUE (flatId, month)
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MaintenanceBill_flatId' AND object_id = OBJECT_ID(N'dbo.MaintenanceBill'))
    CREATE INDEX IX_MaintenanceBill_flatId ON dbo.MaintenanceBill(flatId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MaintenanceBill_status' AND object_id = OBJECT_ID(N'dbo.MaintenanceBill'))
    CREATE INDEX IX_MaintenanceBill_status ON dbo.MaintenanceBill(status);
GO

IF OBJECT_ID(N'dbo.Amenity', N'U') IS NULL
CREATE TABLE dbo.Amenity (
    id          NVARCHAR(32)  NOT NULL PRIMARY KEY,
    name        NVARCHAR(255) NOT NULL,
    description NVARCHAR(1000) NULL,
    openTime    NVARCHAR(20)  NULL,
    closeTime   NVARCHAR(20)  NULL,
    societyId   NVARCHAR(32)  NOT NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Amenity_societyId' AND object_id = OBJECT_ID(N'dbo.Amenity'))
    CREATE INDEX IX_Amenity_societyId ON dbo.Amenity(societyId);
GO

IF OBJECT_ID(N'dbo.AmenityBooking', N'U') IS NULL
CREATE TABLE dbo.AmenityBooking (
    id        NVARCHAR(32)  NOT NULL PRIMARY KEY,
    amenityId NVARCHAR(32)  NOT NULL,
    flatId    NVARCHAR(32)  NOT NULL,
    userId    NVARCHAR(32)  NOT NULL,
    slotStart DATETIME2     NOT NULL,
    slotEnd   DATETIME2     NOT NULL,
    status    NVARCHAR(50)  NOT NULL DEFAULT N'PENDING',
    notes     NVARCHAR(500) NULL,
    createdAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AmenityBooking_amenityId' AND object_id = OBJECT_ID(N'dbo.AmenityBooking'))
    CREATE INDEX IX_AmenityBooking_amenityId ON dbo.AmenityBooking(amenityId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AmenityBooking_flatId' AND object_id = OBJECT_ID(N'dbo.AmenityBooking'))
    CREATE INDEX IX_AmenityBooking_flatId ON dbo.AmenityBooking(flatId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AmenityBooking_userId' AND object_id = OBJECT_ID(N'dbo.AmenityBooking'))
    CREATE INDEX IX_AmenityBooking_userId ON dbo.AmenityBooking(userId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_AmenityBooking_status' AND object_id = OBJECT_ID(N'dbo.AmenityBooking'))
    CREATE INDEX IX_AmenityBooking_status ON dbo.AmenityBooking(status);
GO

IF OBJECT_ID(N'dbo.EmergencyContact', N'U') IS NULL
CREATE TABLE dbo.EmergencyContact (
    id        NVARCHAR(32)  NOT NULL PRIMARY KEY,
    name      NVARCHAR(255) NOT NULL,
    role      NVARCHAR(100) NOT NULL,
    phone     NVARCHAR(50)  NOT NULL,
    societyId NVARCHAR(32)  NOT NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_EmergencyContact_societyId' AND object_id = OBJECT_ID(N'dbo.EmergencyContact'))
    CREATE INDEX IX_EmergencyContact_societyId ON dbo.EmergencyContact(societyId);
GO

IF OBJECT_ID(N'dbo.DirectoryEntry', N'U') IS NULL
CREATE TABLE dbo.DirectoryEntry (
    id              NVARCHAR(32)  NOT NULL PRIMARY KEY,
    flatId          NVARCHAR(32)  NOT NULL,
    displayName     NVARCHAR(255) NOT NULL,
    phone           NVARCHAR(50)  NULL,
    showInDirectory BIT           NOT NULL DEFAULT 1
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DirectoryEntry_flatId' AND object_id = OBJECT_ID(N'dbo.DirectoryEntry'))
    CREATE UNIQUE INDEX IX_DirectoryEntry_flatId ON dbo.DirectoryEntry(flatId);
GO

IF OBJECT_ID(N'dbo.Document', N'U') IS NULL
CREATE TABLE dbo.Document (
    id        NVARCHAR(32)  NOT NULL PRIMARY KEY,
    title     NVARCHAR(500) NOT NULL,
    category  NVARCHAR(100) NOT NULL,
    fileUrl   NVARCHAR(500) NULL,
    body      NVARCHAR(4000) NULL,
    societyId NVARCHAR(32)  NOT NULL,
    createdAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Document_societyId' AND object_id = OBJECT_ID(N'dbo.Document'))
    CREATE INDEX IX_Document_societyId ON dbo.Document(societyId);
GO

IF OBJECT_ID(N'dbo.Event', N'U') IS NULL
CREATE TABLE dbo.Event (
    id        NVARCHAR(32)  NOT NULL PRIMARY KEY,
    title     NVARCHAR(500) NOT NULL,
    body      NVARCHAR(4000) NULL,
    location  NVARCHAR(500) NULL,
    startsAt  DATETIME2     NOT NULL,
    endsAt    DATETIME2     NULL,
    societyId NVARCHAR(32)  NOT NULL,
    createdAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Event_societyId' AND object_id = OBJECT_ID(N'dbo.Event'))
    CREATE INDEX IX_Event_societyId ON dbo.Event(societyId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Event_startsAt' AND object_id = OBJECT_ID(N'dbo.Event'))
    CREATE INDEX IX_Event_startsAt ON dbo.Event(startsAt);
GO

IF OBJECT_ID(N'dbo.Poll', N'U') IS NULL
CREATE TABLE dbo.Poll (
    id        NVARCHAR(32)  NOT NULL PRIMARY KEY,
    question  NVARCHAR(1000) NOT NULL,
    endsAt    DATETIME2     NOT NULL,
    societyId NVARCHAR(32)  NOT NULL,
    createdAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Poll_societyId' AND object_id = OBJECT_ID(N'dbo.Poll'))
    CREATE INDEX IX_Poll_societyId ON dbo.Poll(societyId);
GO

IF OBJECT_ID(N'dbo.PollOption', N'U') IS NULL
CREATE TABLE dbo.PollOption (
    id     NVARCHAR(32)  NOT NULL PRIMARY KEY,
    text   NVARCHAR(500) NOT NULL,
    pollId NVARCHAR(32)  NOT NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PollOption_pollId' AND object_id = OBJECT_ID(N'dbo.PollOption'))
    CREATE INDEX IX_PollOption_pollId ON dbo.PollOption(pollId);
GO

IF OBJECT_ID(N'dbo.PollVote', N'U') IS NULL
CREATE TABLE dbo.PollVote (
    id       NVARCHAR(32) NOT NULL PRIMARY KEY,
    pollId   NVARCHAR(32) NOT NULL,
    optionId NVARCHAR(32) NOT NULL,
    userId   NVARCHAR(32) NOT NULL,
    CONSTRAINT UQ_PollVote_pollId_userId UNIQUE (pollId, userId)
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PollVote_optionId' AND object_id = OBJECT_ID(N'dbo.PollVote'))
    CREATE INDEX IX_PollVote_optionId ON dbo.PollVote(optionId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PollVote_userId' AND object_id = OBJECT_ID(N'dbo.PollVote'))
    CREATE INDEX IX_PollVote_userId ON dbo.PollVote(userId);
GO

IF OBJECT_ID(N'dbo.MoveRequest', N'U') IS NULL
CREATE TABLE dbo.MoveRequest (
    id        NVARCHAR(32)  NOT NULL PRIMARY KEY,
    type      NVARCHAR(50)  NOT NULL,
    status    NVARCHAR(50)  NOT NULL DEFAULT N'REQUESTED',
    flatId    NVARCHAR(32)  NOT NULL,
    userId    NVARCHAR(32)  NOT NULL,
    moveDate  DATETIME2     NOT NULL,
    notes     NVARCHAR(1000) NULL,
    createdAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MoveRequest_flatId' AND object_id = OBJECT_ID(N'dbo.MoveRequest'))
    CREATE INDEX IX_MoveRequest_flatId ON dbo.MoveRequest(flatId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MoveRequest_userId' AND object_id = OBJECT_ID(N'dbo.MoveRequest'))
    CREATE INDEX IX_MoveRequest_userId ON dbo.MoveRequest(userId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MoveRequest_status' AND object_id = OBJECT_ID(N'dbo.MoveRequest'))
    CREATE INDEX IX_MoveRequest_status ON dbo.MoveRequest(status);
GO

IF OBJECT_ID(N'dbo.SosAlert', N'U') IS NULL
CREATE TABLE dbo.SosAlert (
    id         NVARCHAR(32)  NOT NULL PRIMARY KEY,
    message    NVARCHAR(1000) NULL,
    status     NVARCHAR(50)  NOT NULL DEFAULT N'ACTIVE',
    userId     NVARCHAR(32)  NOT NULL,
    flatLabel  NVARCHAR(50)  NOT NULL,
    createdAt  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    resolvedAt DATETIME2     NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SosAlert_userId' AND object_id = OBJECT_ID(N'dbo.SosAlert'))
    CREATE INDEX IX_SosAlert_userId ON dbo.SosAlert(userId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SosAlert_status' AND object_id = OBJECT_ID(N'dbo.SosAlert'))
    CREATE INDEX IX_SosAlert_status ON dbo.SosAlert(status);
GO

IF OBJECT_ID(N'dbo.KidExitRequest', N'U') IS NULL
CREATE TABLE dbo.KidExitRequest (
    id           NVARCHAR(32)  NOT NULL PRIMARY KEY,
    childName    NVARCHAR(255) NOT NULL,
    childAge     INT           NULL,
    flatId       NVARCHAR(32)  NOT NULL,
    parentId     NVARCHAR(32)  NOT NULL,
    status       NVARCHAR(50)  NOT NULL DEFAULT N'PENDING_APPROVAL',
    otp          NVARCHAR(20)  NULL,
    requestedAt  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    approvedAt   DATETIME2     NULL,
    checkedOutAt DATETIME2     NULL,
    gateNotes    NVARCHAR(1000) NULL
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_KidExitRequest_flatId' AND object_id = OBJECT_ID(N'dbo.KidExitRequest'))
    CREATE INDEX IX_KidExitRequest_flatId ON dbo.KidExitRequest(flatId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_KidExitRequest_parentId' AND object_id = OBJECT_ID(N'dbo.KidExitRequest'))
    CREATE INDEX IX_KidExitRequest_parentId ON dbo.KidExitRequest(parentId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_KidExitRequest_status' AND object_id = OBJECT_ID(N'dbo.KidExitRequest'))
    CREATE INDEX IX_KidExitRequest_status ON dbo.KidExitRequest(status);
GO

IF OBJECT_ID(N'dbo.StaffRating', N'U') IS NULL
CREATE TABLE dbo.StaffRating (
    id        NVARCHAR(32)  NOT NULL PRIMARY KEY,
    staffId   NVARCHAR(32)  NOT NULL,
    userId    NVARCHAR(32)  NOT NULL,
    rating    INT           NOT NULL,
    review    NVARCHAR(2000) NULL,
    createdAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_StaffRating_staffId_userId UNIQUE (staffId, userId)
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_StaffRating_userId' AND object_id = OBJECT_ID(N'dbo.StaffRating'))
    CREATE INDEX IX_StaffRating_userId ON dbo.StaffRating(userId);
GO

IF OBJECT_ID(N'dbo.SocietyExpense', N'U') IS NULL
CREATE TABLE dbo.SocietyExpense (
    id           NVARCHAR(32)  NOT NULL PRIMARY KEY,
    title        NVARCHAR(500) NOT NULL,
    category     NVARCHAR(100) NOT NULL,
    amount       FLOAT         NOT NULL,
    description  NVARCHAR(1000) NULL,
    paidTo       NVARCHAR(255) NULL,
    expenseDate  DATETIME2     NOT NULL,
    receiptRef   NVARCHAR(255) NULL,
    receiptImage NVARCHAR(500) NULL,
    societyId    NVARCHAR(32)  NOT NULL,
    recordedById NVARCHAR(32)  NOT NULL,
    createdAt    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SocietyExpense_societyId' AND object_id = OBJECT_ID(N'dbo.SocietyExpense'))
    CREATE INDEX IX_SocietyExpense_societyId ON dbo.SocietyExpense(societyId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SocietyExpense_recordedById' AND object_id = OBJECT_ID(N'dbo.SocietyExpense'))
    CREATE INDEX IX_SocietyExpense_recordedById ON dbo.SocietyExpense(recordedById);
GO

IF OBJECT_ID(N'dbo.SocietyTransaction', N'U') IS NULL
CREATE TABLE dbo.SocietyTransaction (
    id           NVARCHAR(32)  NOT NULL PRIMARY KEY,
    type         NVARCHAR(50)  NOT NULL,
    amount       FLOAT         NOT NULL,
    description  NVARCHAR(1000) NOT NULL,
    method       NVARCHAR(50)  NOT NULL DEFAULT N'UPI',
    reference    NVARCHAR(255) NULL,
    societyId    NVARCHAR(32)  NOT NULL,
    flatId       NVARCHAR(32)  NULL,
    billId       NVARCHAR(32)  NULL,
    expenseId    NVARCHAR(32)  NULL,
    recordedById NVARCHAR(32)  NOT NULL,
    createdAt    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SocietyTransaction_societyId' AND object_id = OBJECT_ID(N'dbo.SocietyTransaction'))
    CREATE INDEX IX_SocietyTransaction_societyId ON dbo.SocietyTransaction(societyId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SocietyTransaction_flatId' AND object_id = OBJECT_ID(N'dbo.SocietyTransaction'))
    CREATE INDEX IX_SocietyTransaction_flatId ON dbo.SocietyTransaction(flatId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SocietyTransaction_recordedById' AND object_id = OBJECT_ID(N'dbo.SocietyTransaction'))
    CREATE INDEX IX_SocietyTransaction_recordedById ON dbo.SocietyTransaction(recordedById);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SocietyTransaction_billId' AND object_id = OBJECT_ID(N'dbo.SocietyTransaction'))
    CREATE UNIQUE INDEX IX_SocietyTransaction_billId ON dbo.SocietyTransaction(billId) WHERE billId IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SocietyTransaction_expenseId' AND object_id = OBJECT_ID(N'dbo.SocietyTransaction'))
    CREATE UNIQUE INDEX IX_SocietyTransaction_expenseId ON dbo.SocietyTransaction(expenseId) WHERE expenseId IS NOT NULL;
GO

IF OBJECT_ID(N'dbo.ResidentNotification', N'U') IS NULL
CREATE TABLE dbo.ResidentNotification (
    id        NVARCHAR(32)  NOT NULL PRIMARY KEY,
    userId    NVARCHAR(32)  NOT NULL,
    type      NVARCHAR(100) NOT NULL,
    title     NVARCHAR(500) NOT NULL,
    body      NVARCHAR(2000) NOT NULL,
    dedupeKey NVARCHAR(255) NULL,
    [read]    BIT           NOT NULL DEFAULT 0,
    createdAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UQ_ResidentNotification_userId_dedupeKey' AND object_id = OBJECT_ID(N'dbo.ResidentNotification'))
    CREATE UNIQUE INDEX UQ_ResidentNotification_userId_dedupeKey ON dbo.ResidentNotification(userId, dedupeKey) WHERE dedupeKey IS NOT NULL;
GO

IF OBJECT_ID(N'dbo.PushSubscription', N'U') IS NULL
CREATE TABLE dbo.PushSubscription (
    id        NVARCHAR(32)  NOT NULL PRIMARY KEY,
    userId    NVARCHAR(32)  NOT NULL,
    endpoint  NVARCHAR(500) NOT NULL,
    p256dh    NVARCHAR(500) NOT NULL,
    auth      NVARCHAR(500) NOT NULL,
    createdAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PushSubscription_userId' AND object_id = OBJECT_ID(N'dbo.PushSubscription'))
    CREATE INDEX IX_PushSubscription_userId ON dbo.PushSubscription(userId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PushSubscription_endpoint' AND object_id = OBJECT_ID(N'dbo.PushSubscription'))
    CREATE UNIQUE INDEX IX_PushSubscription_endpoint ON dbo.PushSubscription(endpoint);
GO

PRINT 'Schema ready — 28 tables for Marvel Rocks Society.';
GO
