using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class addReDirectAttribute : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ReDirected",
                table: "Risks",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ReDirected",
                table: "RiskRequests",
                type: "bit",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReDirected",
                table: "Risks");

            migrationBuilder.DropColumn(
                name: "ReDirected",
                table: "RiskRequests");
        }
    }
}
