using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class changeCategoryNameToString : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Risks_Categories_CategoryID",
                table: "Risks");

            migrationBuilder.DropColumn(
                name: "report",
                table: "RiskRequests");

            migrationBuilder.RenameColumn(
                name: "CategoryID",
                table: "Risks",
                newName: "CategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_Risks_CategoryID",
                table: "Risks",
                newName: "IX_Risks_CategoryId");

            migrationBuilder.AlterColumn<int>(
                name: "CategoryId",
                table: "Risks",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "CategoryName",
                table: "Risks",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_Risks_Categories_CategoryId",
                table: "Risks",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Risks_Categories_CategoryId",
                table: "Risks");

            migrationBuilder.DropColumn(
                name: "CategoryName",
                table: "Risks");

            migrationBuilder.RenameColumn(
                name: "CategoryId",
                table: "Risks",
                newName: "CategoryID");

            migrationBuilder.RenameIndex(
                name: "IX_Risks_CategoryId",
                table: "Risks",
                newName: "IX_Risks_CategoryID");

            migrationBuilder.AlterColumn<int>(
                name: "CategoryID",
                table: "Risks",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "report",
                table: "RiskRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Risks_Categories_CategoryID",
                table: "Risks",
                column: "CategoryID",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
