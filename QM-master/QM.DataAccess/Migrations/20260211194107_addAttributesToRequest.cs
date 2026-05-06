using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class addAttributesToRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RiskRequests_Responsible_ResponsibleId1",
                table: "RiskRequests");

            migrationBuilder.RenameColumn(
                name: "WorkEntity",
                table: "RiskRequests",
                newName: "Department");

            migrationBuilder.RenameColumn(
                name: "ResponsibleId1",
                table: "RiskRequests",
                newName: "ResponsibleId");

            migrationBuilder.RenameIndex(
                name: "IX_RiskRequests_ResponsibleId1",
                table: "RiskRequests",
                newName: "IX_RiskRequests_ResponsibleId");

            migrationBuilder.AddForeignKey(
                name: "FK_RiskRequests_Responsible_ResponsibleId",
                table: "RiskRequests",
                column: "ResponsibleId",
                principalTable: "Responsible",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RiskRequests_Responsible_ResponsibleId",
                table: "RiskRequests");

            migrationBuilder.RenameColumn(
                name: "ResponsibleId",
                table: "RiskRequests",
                newName: "ResponsibleId1");

            migrationBuilder.RenameColumn(
                name: "Department",
                table: "RiskRequests",
                newName: "WorkEntity");

            migrationBuilder.RenameIndex(
                name: "IX_RiskRequests_ResponsibleId",
                table: "RiskRequests",
                newName: "IX_RiskRequests_ResponsibleId1");

            migrationBuilder.AddForeignKey(
                name: "FK_RiskRequests_Responsible_ResponsibleId1",
                table: "RiskRequests",
                column: "ResponsibleId1",
                principalTable: "Responsible",
                principalColumn: "Id");
        }
    }
}
