using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class addRiskController : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Risks",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "Notifications",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Risks");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "Notifications",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
