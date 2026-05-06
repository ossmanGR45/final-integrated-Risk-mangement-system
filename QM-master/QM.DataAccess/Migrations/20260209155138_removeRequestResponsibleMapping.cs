using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class removeRequestResponsibleMapping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RequestEntityMappings");

            migrationBuilder.DropColumn(
                name: "Responsible",
                table: "RiskRequests");

            migrationBuilder.AddColumn<int>(
                name: "ResponsibleId1",
                table: "RiskRequests",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RiskRequests_ResponsibleId1",
                table: "RiskRequests",
                column: "ResponsibleId1");

            migrationBuilder.AddForeignKey(
                name: "FK_RiskRequests_Responsible_ResponsibleId1",
                table: "RiskRequests",
                column: "ResponsibleId1",
                principalTable: "Responsible",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RiskRequests_Responsible_ResponsibleId1",
                table: "RiskRequests");

            migrationBuilder.DropIndex(
                name: "IX_RiskRequests_ResponsibleId1",
                table: "RiskRequests");

            migrationBuilder.DropColumn(
                name: "ResponsibleId1",
                table: "RiskRequests");

            migrationBuilder.AddColumn<string>(
                name: "Responsible",
                table: "RiskRequests",
                type: "nvarchar(max)",
                nullable: true);

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
                        name: "FK_RequestEntityMappings_Responsible_ResponsibleID",
                        column: x => x.ResponsibleID,
                        principalTable: "Responsible",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RequestEntityMappings_RiskRequests_RequestID",
                        column: x => x.RequestID,
                        principalTable: "RiskRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RequestEntityMappings_RequestID",
                table: "RequestEntityMappings",
                column: "RequestID");

            migrationBuilder.CreateIndex(
                name: "IX_RequestEntityMappings_ResponsibleID",
                table: "RequestEntityMappings",
                column: "ResponsibleID");
        }
    }
}
