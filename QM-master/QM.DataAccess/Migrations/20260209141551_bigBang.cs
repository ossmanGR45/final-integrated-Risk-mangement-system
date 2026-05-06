using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace QM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class bigBang : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Actions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActionDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ActionType = table.Column<int>(type: "int", nullable: true),
                    Custom = table.Column<bool>(type: "bit", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Actions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RefreshToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RefreshTokenExpiryTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ManagerId = table.Column<int>(type: "int", nullable: true),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TableName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    OldValues = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewValues = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AffectedColumns = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PrimaryKey = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryName = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Causes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CauseDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Custom = table.Column<bool>(type: "bit", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Causes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Entities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EntityName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContactName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContactEmail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContactPhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Entities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Responsibles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Responsibles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StrategicGoals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GoalReference = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GoalDescription = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StrategicGoals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Risks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RiskName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RiskDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    likelihood = table.Column<int>(type: "int", nullable: true),
                    Impact = table.Column<int>(type: "int", nullable: true),
                    Custom = table.Column<bool>(type: "bit", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    CategoryID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Risks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Risks_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Risks_Categories_CategoryID",
                        column: x => x.CategoryID,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActionCauseMappings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActionID = table.Column<int>(type: "int", nullable: false),
                    CauseID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActionCauseMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActionCauseMappings_Actions_ActionID",
                        column: x => x.ActionID,
                        principalTable: "Actions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActionCauseMappings_Causes_CauseID",
                        column: x => x.CauseID,
                        principalTable: "Causes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActionResponsibleMapping",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActionId = table.Column<int>(type: "int", nullable: false),
                    ResponsibleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActionResponsibleMapping", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActionResponsibleMapping_Actions_ActionId",
                        column: x => x.ActionId,
                        principalTable: "Actions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActionResponsibleMapping_Entities_ResponsibleId",
                        column: x => x.ResponsibleId,
                        principalTable: "Entities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RiskActionMappings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RiskID = table.Column<int>(type: "int", nullable: false),
                    ActionID = table.Column<int>(type: "int", nullable: false),
                    Custom = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskActionMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiskActionMappings_Actions_ActionID",
                        column: x => x.ActionID,
                        principalTable: "Actions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RiskActionMappings_Risks_RiskID",
                        column: x => x.RiskID,
                        principalTable: "Risks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RiskCauseMappings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RiskID = table.Column<int>(type: "int", nullable: false),
                    CauseID = table.Column<int>(type: "int", nullable: false),
                    Custom = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskCauseMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiskCauseMappings_Causes_CauseID",
                        column: x => x.CauseID,
                        principalTable: "Causes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RiskCauseMappings_Risks_RiskID",
                        column: x => x.RiskID,
                        principalTable: "Risks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RiskGoalMappings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RiskId = table.Column<int>(type: "int", nullable: false),
                    Custom = table.Column<bool>(type: "bit", nullable: false),
                    StrategicGoalId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskGoalMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiskGoalMappings_Risks_RiskId",
                        column: x => x.RiskId,
                        principalTable: "Risks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RiskGoalMappings_StrategicGoals_StrategicGoalId",
                        column: x => x.StrategicGoalId,
                        principalTable: "StrategicGoals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RiskRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkEntity = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Year = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Likelihood = table.Column<int>(type: "int", nullable: true),
                    Impact = table.Column<int>(type: "int", nullable: true),
                    ExpectedTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Responsible = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: true),
                    Occured = table.Column<bool>(type: "bit", nullable: true),
                    PostLikelihood = table.Column<int>(type: "int", nullable: true),
                    PostImpact = table.Column<int>(type: "int", nullable: true),
                    report = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    RiskId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiskRequests_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RiskRequests_Risks_RiskId",
                        column: x => x.RiskId,
                        principalTable: "Risks",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RequestActionMappings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestID = table.Column<int>(type: "int", nullable: false),
                    ActionID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestActionMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RequestActionMappings_Actions_ActionID",
                        column: x => x.ActionID,
                        principalTable: "Actions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RequestActionMappings_RiskRequests_RequestID",
                        column: x => x.RequestID,
                        principalTable: "RiskRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RequestCauseMappings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestID = table.Column<int>(type: "int", nullable: false),
                    CauseID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestCauseMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RequestCauseMappings_Causes_CauseID",
                        column: x => x.CauseID,
                        principalTable: "Causes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RequestCauseMappings_RiskRequests_RequestID",
                        column: x => x.RequestID,
                        principalTable: "RiskRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RequestEntityMappings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestID = table.Column<int>(type: "int", nullable: false),
                    ResponsibleID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestEntityMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RequestEntityMappings_Entities_ResponsibleID",
                        column: x => x.ResponsibleID,
                        principalTable: "Entities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RequestEntityMappings_RiskRequests_RequestID",
                        column: x => x.RequestID,
                        principalTable: "RiskRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { 1, null, "Initi", "INITI" },
                    { 2, null, "Risk Manager", "RISK MANAGER" },
                    { 3, null, "Admin", "ADMIN" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActionCauseMappings_ActionID",
                table: "ActionCauseMappings",
                column: "ActionID");

            migrationBuilder.CreateIndex(
                name: "IX_ActionCauseMappings_CauseID",
                table: "ActionCauseMappings",
                column: "CauseID");

            migrationBuilder.CreateIndex(
                name: "IX_ActionResponsibleMapping_ActionId",
                table: "ActionResponsibleMapping",
                column: "ActionId");

            migrationBuilder.CreateIndex(
                name: "IX_ActionResponsibleMapping_ResponsibleId",
                table: "ActionResponsibleMapping",
                column: "ResponsibleId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_RequestActionMappings_ActionID",
                table: "RequestActionMappings",
                column: "ActionID");

            migrationBuilder.CreateIndex(
                name: "IX_RequestActionMappings_RequestID",
                table: "RequestActionMappings",
                column: "RequestID");

            migrationBuilder.CreateIndex(
                name: "IX_RequestCauseMappings_CauseID",
                table: "RequestCauseMappings",
                column: "CauseID");

            migrationBuilder.CreateIndex(
                name: "IX_RequestCauseMappings_RequestID",
                table: "RequestCauseMappings",
                column: "RequestID");

            migrationBuilder.CreateIndex(
                name: "IX_RequestEntityMappings_RequestID",
                table: "RequestEntityMappings",
                column: "RequestID");

            migrationBuilder.CreateIndex(
                name: "IX_RequestEntityMappings_ResponsibleID",
                table: "RequestEntityMappings",
                column: "ResponsibleID");

            migrationBuilder.CreateIndex(
                name: "IX_RiskActionMappings_ActionID",
                table: "RiskActionMappings",
                column: "ActionID");

            migrationBuilder.CreateIndex(
                name: "IX_RiskActionMappings_RiskID",
                table: "RiskActionMappings",
                column: "RiskID");

            migrationBuilder.CreateIndex(
                name: "IX_RiskCauseMappings_CauseID",
                table: "RiskCauseMappings",
                column: "CauseID");

            migrationBuilder.CreateIndex(
                name: "IX_RiskCauseMappings_RiskID",
                table: "RiskCauseMappings",
                column: "RiskID");

            migrationBuilder.CreateIndex(
                name: "IX_RiskGoalMappings_RiskId",
                table: "RiskGoalMappings",
                column: "RiskId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskGoalMappings_StrategicGoalId",
                table: "RiskGoalMappings",
                column: "StrategicGoalId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskRequests_RiskId",
                table: "RiskRequests",
                column: "RiskId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskRequests_UserId",
                table: "RiskRequests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Risks_CategoryID",
                table: "Risks",
                column: "CategoryID");

            migrationBuilder.CreateIndex(
                name: "IX_Risks_UserId",
                table: "Risks",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActionCauseMappings");

            migrationBuilder.DropTable(
                name: "ActionResponsibleMapping");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "RequestActionMappings");

            migrationBuilder.DropTable(
                name: "RequestCauseMappings");

            migrationBuilder.DropTable(
                name: "RequestEntityMappings");

            migrationBuilder.DropTable(
                name: "Responsibles");

            migrationBuilder.DropTable(
                name: "RiskActionMappings");

            migrationBuilder.DropTable(
                name: "RiskCauseMappings");

            migrationBuilder.DropTable(
                name: "RiskGoalMappings");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "Entities");

            migrationBuilder.DropTable(
                name: "RiskRequests");

            migrationBuilder.DropTable(
                name: "Actions");

            migrationBuilder.DropTable(
                name: "Causes");

            migrationBuilder.DropTable(
                name: "StrategicGoals");

            migrationBuilder.DropTable(
                name: "Risks");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "Categories");
        }
    }
}
